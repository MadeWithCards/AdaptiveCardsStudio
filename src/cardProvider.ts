import * as vscode from "vscode";
import {INode} from "./model/nodes/INode";
import * as glob from "glob";
import * as path from "path";
import * as fs from "fs";
import { ProjectErrorNode } from "./model/nodes/ProjectErrorNode";
import { CardNode } from "./model/CardNode";
import { AdaptiveCardsMain } from "./adaptiveCards";
import { WorkspaceFolderNode } from "./model/WorkspaceFolderNode";

export class CardProvider implements vscode.TreeDataProvider<INode> {
    private readonly acm: AdaptiveCardsMain;

    public _onDidChangeTreeData: vscode.EventEmitter<INode | void> = new vscode.EventEmitter<INode | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	get onDidChange(): vscode.Event<vscode.Uri> { return this._onDidChange.event; }

    constructor(private context: vscode.ExtensionContext,  acm: AdaptiveCardsMain) {
        this.acm = acm;
    }

	refresh(node?: INode): void {

        if(node) {
            this._onDidChangeTreeData.fire(node);
        }

		this._onDidChangeTreeData.fire();
	}

    public async getChildren(element?: INode): Promise<INode[]> {
        console.log("ACSTUDIO - Get Child Nodes");
        if(!element) {
            vscode.window.showInformationMessage("Searching for Adaptive Cards in your workspace");
            return await this.GetAdaptiveCardsInFolder();
        }
        return element.getChildren(this.context);
    }

    public async GetAdaptiveCardsInFolder(): Promise<INode[]> {
        console.log("ACSTUDIO - Searching for Cards");
        const items: INode[] = [];

        var i = 0;
        if(vscode.workspace.workspaceFolders.length > 1) {
            vscode.workspace.workspaceFolders.forEach(async folder => {
                items.push(new WorkspaceFolderNode(folder.name,folder.uri.path,i, this.acm));
                i++;
            });
         } else{
            var i = 0;
            var files = await glob.sync(vscode.workspace.workspaceFolders[0].uri.path.substring(1) + "/**/*.json", { ignore: ["**/node_modules/**", "./node_modules/**"] });
            files.forEach(file => {
                var name = path.basename(file,".json");
                const searchTerm = "adaptivecards.io/schemas/adaptive-card.json";
                var content = fs.readFileSync(file, "utf8");
                if (content.includes(searchTerm)) {
                    var node = new CardNode(name,file, i, this.acm);
                    items.push(node);
                    i++;
                }
            });
    
            var files = await glob.sync(vscode.workspace.workspaceFolders[0].uri.path.substring(1) + "/**/*.ac", { ignore: ["**/node_modules/**", "./node_modules/**"] });
            var i = 0;
            files.forEach(file => {
                var name = path.basename(file,".json");
                const searchTerm = "adaptivecards.io/schemas/adaptive-card.json";
                var content = fs.readFileSync(file, "utf8");
                if (content.includes(searchTerm)) {
                    var node = new CardNode(name,file, i, this.acm);
                    items.push(node);
                    i++;
                }
            });

        }
        
        if(items.length === 0) {
            items.push(new ProjectErrorNode("Your workspace does not contain any Adaptive Cards","","",0));
        }

        return items;
    }

    public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem  {
        return element.getTreeItem();
    }

}