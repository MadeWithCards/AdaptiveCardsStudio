import * as vscode from "vscode";
import { INode } from "./nodes/INode";
import { CardNodeChild } from "./CardNodeChild";
import { AdaptiveCardsMain } from "../adaptiveCards";
import * as glob from "glob";
import * as path from "path";
import * as fs from "fs";
import { CardNode } from "./CardNode";
import { ProjectErrorNode } from "./nodes/ProjectErrorNode";

export class WorkspaceFolderNode implements INode {

    private readonly acm: AdaptiveCardsMain;
    private readonly localPath: string;
    constructor(private readonly label: string, readonly path: string, readonly id: number, acm: AdaptiveCardsMain) {
        this.acm = acm;
        this.localPath = path;
    }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "ac-rootFolderNode"
        };
    }
    public async getChildren(context: vscode.ExtensionContext): Promise<INode[]> {

        try {
            return await this.GetAdaptiveCardsInFolder();
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }
    }

    public async GetAdaptiveCardsInFolder(): Promise<INode[]> {
        console.log("ACSTUDIO - Searching for Cards");
        const items: INode[] = [];


        var files = await glob.sync(
            vscode.workspace.workspaceFolders[0].uri.path + "/**/*.json", 
            { 
            ignore: ["**/node_modules/**", "./node_modules/**"],
            }
        );
        if(files.length == 0) {
            files = await glob.sync(
                vscode.workspace.workspaceFolders[0].uri.path.substring(1) + "/**/*.json", 
                { 
                ignore: ["**/node_modules/**", "./node_modules/**"],
                }
            ); 
        }
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

        if(items.length === 0) {
            items.push(new ProjectErrorNode("No Cards found","","",0));
        }


        return items;
    }



}
