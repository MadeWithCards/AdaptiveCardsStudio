import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { WebViews } from "./webviews";
import { isNullOrUndefined } from "util";
import { AdaptiveCardsAPIHelper } from "./graphApi";
import { QuickPickHelper } from "./model/QuickPickHelper";
import * as axios from "axios";
import { scopes } from "./constants";
import { Card } from "./model/AdaptiveOnlineEntry";

export class AdaptiveCardsMain {
    private readonly _extensionPath: string;
    public panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;
    public apihelper: AdaptiveCardsAPIHelper;
    public WebViews: WebViews;
    public Channel: vscode.OutputChannel;
    public templates : Card[] = [];

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this.context = context;
        this._extensionPath = extensionPath;
        this.WebViews = new WebViews(this._context, this._context.extensionPath);
        this.apihelper = new AdaptiveCardsAPIHelper(this._context, this._extensionPath, null);
        context.subscriptions.push(this.apihelper);
        this.Channel = vscode.window.createOutputChannel("AdaptiveCards");
        this.Channel.appendLine("Log Channel Initated");

    }

    public async clearCredentials(): Promise<void> {
        this.apihelper.userSession = null;
    }

    public async Initialize(): Promise<void> {
       const session: vscode.AuthenticationSession = await vscode.authentication.getSession("microsoft", scopes, { createIfNone: false });

        if(session != null) {
            this.apihelper.userSession = session;
        } else {
            this.apihelper.userSession = null;
        }

    }


	public async AddCard() : Promise<Boolean>{

        if(vscode.workspace != null && vscode.workspace.workspaceFolders.length > 0) {
            var folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
            var cardFilePath: string = await this.ValidateFileName(path.join(folder, "newCard.json"));
            var dataFilePath: string = await this.ValidateFileName(path.join(folder, "newCard.data.json"));

            var dataFileData = {
                "title": "Publish Adaptive Card Schema",
                "description": "Now that we have defined the main rules and features of the format, we need to produce a schema and publish it to GitHub. The schema will be the starting point of our reference documentation.",
                "creator": {
                    "name": "Matt Hidinger",
                    "profileImage": "https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg"
                },
                "createdUtc": "2017-02-14T06:08:39Z",
                "viewUrl": "https://adaptivecards.io",
                "properties": [
                    {
                        "key": "Board",
                        "value": "Adaptive Cards"
                    },
                    {
                        "key": "List",
                        "value": "Backlog"
                    },
                    {
                        "key": "Assigned to",
                        "value": "Matt Hidinger"
                    },
                    {
                        "key": "Due date",
                        "value": "Not set"
                    }
                ]
            }

            var cardFileData = {
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Medium",
                        "weight": "Bolder",
                        "text": "${title}"
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "Image",
                                        "style": "Person",
                                        "url": "${creator.profileImage}",
                                        "size": "Small"
                                    }
                                ],
                                "width": "auto"
                            },
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "weight": "Bolder",
                                        "text": "${creator.name}",
                                        "wrap": true
                                    },
                                    {
                                        "type": "TextBlock",
                                        "spacing": "None",
                                        "text": "Created {{DATE(${createdUtc},SHORT)}}",
                                        "isSubtle": true,
                                        "wrap": true
                                    }
                                ],
                                "width": "stretch"
                            }
                        ]
                    },
                    {
                        "type": "TextBlock",
                        "text": "${description}",
                        "wrap": true
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "$data": "${properties}",
                                "title": "${key}:",
                                "value": "${value}"
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.ShowCard",
                        "title": "Set due date",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "Input.Date",
                                    "id": "dueDate"
                                },
                                {
                                    "type": "Input.Text",
                                    "id": "comment",
                                    "placeholder": "Add a comment",
                                    "isMultiline": true
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.Submit",
                                    "title": "OK"
                                }
                            ],
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
                        }
                    },
                    {
                        "type": "Action.OpenUrl",
                        "title": "View",
                        "url": "${viewUrl}"
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.4"
            }

            this.writeFile(cardFilePath,JSON.stringify(cardFileData, null, "\t")).then(() =>{
                this.writeFile(dataFilePath,JSON.stringify(dataFileData, null, "\t")).then(()=> {
                    this.OpenCard(cardFilePath);
                    vscode.commands.executeCommand("cardList.refresh");
                })
            });

        }


		return true;
	}

    public async ValidateFileName(fileName, increment = 0) : Promise<string> {

        try {
            if (fs.existsSync(fileName)) {
              increment += 1;
              return this.ValidateFileName(fileName.replace(".json","") + increment + ".json")
            } else {
                return fileName;
            }
          } catch(err) {

            return "";
        }
    }


    public writeFile = async(filename, data) => {
        return await fs.writeFile(filename, data, async err => {
            if(err) {
                console.log(err);
            }
        })
      }

	public async checkNoAdaptiveCard(document: vscode.TextDocument, displayMessage: boolean = true) : Promise<Boolean>{

		if(document == null){
            if(!vscode.window.activeTextEditor) return false;
			document = vscode.window.activeTextEditor.document;
		}
		let isNGType = !(document.languageId === "json") || document.getText().indexOf("schemas/adaptive-card.json") < 0;
		if (isNGType && displayMessage) {
            vscode.window.showWarningMessage("Active editor doesn't show a AdaptiveCard JSON document.");
            return false;
		}
		return isNGType;
	}

    // tslint:disable-next-line: typedef
    public async OpenOrUpdatePanel(cardPath: string, content: string) {

        let activeEditor: vscode.TextEditor = vscode.window.activeTextEditor;
        if(activeEditor == null ||activeEditor.document == null) {
            return;
        }

        let text: string = "", data: string = "";
        // when a data file is edited, get text from json template instead
        // when a template is edited, get data from json.data instead
        if(activeEditor.document.fileName.endsWith(".data.json")) {
            var templatefilePath: string = activeEditor.document.fileName.replace(".data","");
            const activeFiles: any = vscode.workspace.textDocuments;
            activeFiles.forEach(file => {
                if(file.fileName === templatefilePath) {
                    text = file.getText();
                }
            });
            if (text === "" && fs.existsSync(templatefilePath)) {
                var rawData: string = require(templatefilePath);
                text = JSON.stringify(rawData);
            }
            data = activeEditor.document.getText();
        } else {
            text = activeEditor.document.getText();
            var dataFilePath: string = activeEditor.document.fileName.replace(".json",".data.json");
            if (fs.existsSync(dataFilePath)) {
                data = fs.readFileSync(dataFilePath, "ascii");
            } else {
                data = "{}";
            }
        }

        const searchTerm: string = "adaptivecards.io/schemas/adaptive-card.json";
        if (text != null && text !== "" && text.includes(searchTerm)) {
            const column : vscode.ViewColumn = vscode.ViewColumn.Beside;
            if(this.panel) {
                try {
                    this.panel.reveal(column,true);
                    this.panel.title = "Adaptive Card";
                } catch {
                    this.panel = vscode.window.createWebviewPanel("ac.CardViewer","Adaptive Card",vscode.ViewColumn.Beside,{
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.joinPath(this._context.extensionUri, 'media')
                        ]
                    });
                }
            } else {
                this.panel = vscode.window.createWebviewPanel("ac.CardViewer","Adaptive Card",vscode.ViewColumn.Beside,{
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this._context.extensionUri, 'media')
                    ]
                });
            }
            var panelData: any =  await this.WebViews.GetWebViewContentAdaptiveCard(text,data, this.panel);
            this.panel.webview.html = panelData.html;

            this.panel.webview.onDidReceiveMessage(
                async message => {

                    if(message.text === "sendEmail") {
                        this.apihelper.SendToEmail(panelData.card,"");
                        return;
                    } 
                    if(message.text === "sendTeams") {
                        this.apihelper.SendToTeams(panelData.card,"");
                        return;
                    } 
                    else {
                        await this.Channel.appendLine("Action.Submit -> ");
                        await this.Channel.append(message.text);
                        await this.Channel.appendLine("");
                    }

                });
        }
    }

    // tslint:disable-next-line: typedef
    public async OpenRemoteCard(cardId: string) {
        try {
            var cardTemplate: string, cardData: string = "";
            var workspacePath: string = vscode.workspace.rootPath;
            vscode.window.showInformationMessage("Opening AdaptiveCard from MadeWithCards.io");

            var config = vscode.workspace.getConfiguration("acstudio");
            var downloadPath: string = config.get("cardTemporaryFolder");

            if(isNullOrUndefined(downloadPath) || downloadPath === "") {
                downloadPath = os.tmpdir();
            }
            if(downloadPath.toLowerCase() === "tmpdir" ) {
                downloadPath = os.tmpdir();
            }

            if(downloadPath.toLowerCase() === "workspace" ) {

                if(isNullOrUndefined(vscode.workspace.rootPath) || vscode.workspace == null || isNullOrUndefined(vscode.workspace)) {
                    vscode.window.showErrorMessage("You need to have an active workspace when download path is set to workspace");
                    return;
                }
                downloadPath = vscode.workspace.rootPath;
            }

            if(isNullOrUndefined(os.tmpdir()) ) {
                vscode.window.showErrorMessage("You need to have an active workspace to open cards remotely");
            } else {
                var axios = require("axios");
                axios.get("https://madewithcards.io/api/cardsv2/" + cardId).then(async response => {
                    cardTemplate = response.data;
                    var filePath: string  = path.join(downloadPath,cardId + ".json");
                    fs.writeFile(filePath, JSON.stringify(cardTemplate, null, 1),err => {
                        vscode.workspace.openTextDocument(filePath).then(card => {
                            vscode.window.showTextDocument(card, vscode.ViewColumn.One, true).then(async e => {
                                vscode.window.activeTextEditor.edit((content) => {
                                    content.insert(vscode.window.activeTextEditor.document.positionAt(0)," ");
                                });
                                await this.OpenOrUpdatePanel("","");
                            });
                        });
                    });
                    axios.get("https://madewithcards.io/api/cardsv2/" + cardId + "?mode=data").then(async response => {
                        cardData = response.data;
                        var filePathdata = path.join(downloadPath, cardId + ".data.json");
                        fs.writeFile(filePathdata, JSON.stringify(cardData, null, 1),err => {
                            vscode.workspace.openTextDocument(filePathdata).then(card => {
                                vscode.window.showTextDocument(card, vscode.ViewColumn.One, true).then(async e => {
                                    await this.OpenOrUpdatePanel("","");
                                });
                            });
                        });
                    });
                });
            }
        } catch(ex) {
            vscode.window.showErrorMessage("Could not retrieve Adaptive Card");
        }
    }

    public async SendCard(path: string): Promise<void> {

        let nodeList: QuickPickHelper[] = [];
        nodeList.push(new QuickPickHelper("Send as Teams Message to yourself", "1",false));
        nodeList.push(new QuickPickHelper("Send as Email to yourself", "2",false));

        const selectedOption: QuickPickHelper = await vscode.window.showQuickPick(nodeList,
            { placeHolder: "How do you want to send the card?", ignoreFocusOut: false, canPickMany: false },
        );
        if (selectedOption) {

            if(selectedOption.id === "1") {
               await this.apihelper.SendToEmail(path, "");
            }
            // if(selectedOption.id === "2") {
            //    await this.apihelper.SendToEmail(path, "");
            // }
        }
    }

    // tslint:disable-next-line: typedef
    public async OpenCard(path: string) {
        if (fs.existsSync(path)) {
			vscode.workspace.openTextDocument(path).then(async card => {
				vscode.window.showTextDocument(card, vscode.ViewColumn.One).then(async e => {
                    await this.OpenOrUpdatePanel("","");
                });
			  });
		} else {
			// tslint:disable-next-line: typedef
			let data = {};
			fs.writeFile(path, JSON.stringify(data),err => {
				vscode.workspace.openTextDocument(path).then(card => {
					vscode.window.showTextDocument(card, vscode.ViewColumn.One).then(async e => {
                        await this.OpenOrUpdatePanel("","");
                    });
				});
			});
		}
    }


    public async DownloadAndOpenCard(id: string, downloadPath: string, name: string) {

        var axios = require("axios");
        axios.get("https://api.madewithcards.io/cards/id/" + id + "/0?mode=full").then( response => {

        
            var filePath: string  = path.join(downloadPath,name + ".json");
            var fileDataPath: string  = path.join(downloadPath,name + ".data.json");
            
            fs.writeFile(filePath, JSON.stringify(response.data.template, null, 1),err => {
                vscode.workspace.openTextDocument(filePath).then(card => {
                    vscode.window.showTextDocument(card, vscode.ViewColumn.One, true).then(async e => {
                        if(vscode.window.activeTextEditor != null) {
                            vscode.window.activeTextEditor.edit((content) => {
                                content.insert(vscode.window.activeTextEditor.document.positionAt(0)," ");
                            });
                        }
                        await this.OpenOrUpdatePanel("","");
                        vscode.commands.executeCommand("cardList.refresh");
                    });
                });

                fs.writeFile(fileDataPath, JSON.stringify(response.data.data, null, 1),err => {
                    vscode.workspace.openTextDocument(fileDataPath).then(card => {
                        vscode.window.showTextDocument(card, vscode.ViewColumn.One, true).then(async e => {
                            if(vscode.window.activeTextEditor != null) {
                                vscode.window.activeTextEditor.edit((content) => {
                                    content.insert(vscode.window.activeTextEditor.document.positionAt(0)," ");
                                });
                            }
                            await this.OpenOrUpdatePanel("","");
                            vscode.commands.executeCommand("cardList.refresh");
                        });
                    });
                });
            });
        });
    }

    public async OpenCardOnline(id: string): Promise<void> {

        if(vscode.workspace.workspaceFolders == undefined || vscode.workspace.workspaceFolders.length == 0){
            vscode.window.showErrorMessage("You need to have an open folder or workspace to open cards");
        } else{
            // Lets get the template
            this.templates.forEach(async element => {
                if(element.id == id){
                    let name = await vscode.window.showInputBox({ placeHolder: element.name });
                    if (name) {

                        var path = "";
                        if(vscode.workspace.workspaceFolders.length > 1){
                            let nodeList: QuickPickHelper[] = [];

                            vscode.workspace.workspaceFolders.forEach(element => {
                                nodeList.push(new QuickPickHelper(element.name, element.uri.fsPath,false));
                            });
                    
                            const selectedOption: QuickPickHelper = await vscode.window.showQuickPick(nodeList,
                                { placeHolder: "Target Workspace for the card.", ignoreFocusOut: false, canPickMany: false },
                            );
                            if (selectedOption) {
                                path = selectedOption.id;
                            }
                        } else{
                            path = vscode.workspace.workspaceFolders[0].uri.fsPath;
                        }

                        if(path != "") {
                            this.DownloadAndOpenCard(id,path,name);
                        }
                    }
                }
            });
        }

    }

    private _disposables: vscode.Disposable[] = [];
	// tslint:disable-next-line: typedef
	public dispose() {
		this.panel.dispose();
        this.panel = null;
		while (this._disposables.length) {
			const x : vscode.Disposable = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}
}