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

export class AdaptiveCardsMain {
    private readonly _extensionPath: string;
    public panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;
    public apihelper: AdaptiveCardsAPIHelper;
    public WebViews: WebViews;
    public Channel: vscode.OutputChannel;
    public templates =  [];

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

        let text: string, data: string = "";
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
                            vscode.Uri.file(path.join(this._extensionPath, "media"))
                        ]
                    });
                }
            } else {
                this.panel = vscode.window.createWebviewPanel("ac.CardViewer","Adaptive Card",vscode.ViewColumn.Beside,{
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(this._extensionPath, "media"))
                    ]
                });
            }
            var panelData: any =  await this.WebViews.GetWebViewContentAdaptiveCard(text,data);
            this.panel.webview.html = panelData.html;

            this.panel.webview.onDidReceiveMessage(
                async message => {

                    if(message.text === "sendEmail") {
                        this.apihelper.SendToEmail(panelData.card,"");
                        return;
                    } else {
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
                axios.get("https://madewithcards.io/api/cardsv2/" + cardId).then( response => {
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
                        filePath = path.join(downloadPath, cardId + ".data.json");
                        fs.writeFile(filePath, JSON.stringify(cardData, null, 1),err => {
                            vscode.workspace.openTextDocument(filePath).then(card => {
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
            if(selectedOption.id === "2") {
               await this.apihelper.SendToEmail(path, "");
            }
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

    public async OpenCardCMS(id: string): Promise<void> {

        // Lets get the template
        this.templates.forEach(element => {
            if(element._id == id){
                var path = vscode.workspace.rootPath + "_" + id + ".json";
                var pathData = vscode.workspace.rootPath + "_" + id + ".data.json";
                if (fs.existsSync(path)) {
                    vscode.workspace.openTextDocument(path).then(async card => {
                        vscode.window.showTextDocument(card, vscode.ViewColumn.One).then(async e => {
                            await this.OpenOrUpdatePanel("","");
                        });
                      });
                } else {
                    fs.writeFile(path, JSON.stringify(element.instances[0].json),err => {
                        fs.writeFile(pathData, JSON.stringify(element.instances[0].data),err => {
                            vscode.workspace.openTextDocument(path).then(card => {
                                vscode.window.showTextDocument(card, vscode.ViewColumn.One).then(async e => {
                                    await this.OpenOrUpdatePanel("","");
                                });
                            });
                        });
                    });
                }
            }
        });
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