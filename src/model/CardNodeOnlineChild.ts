import * as vscode from "vscode";
import { INode } from "./nodes/INode";
import { CardNodeChild } from "./CardNodeChild";
import { AdaptiveCardsMain } from "../adaptiveCards";
import * as path from 'path';

export class CardNodeOnlineChild implements INode {

    private readonly acm: AdaptiveCardsMain;
    private readonly Author: string;


    constructor(
        readonly label: string,
        readonly path: string,
        readonly id: number,
        author: string,
        acm: AdaptiveCardsMain) {
        this.acm = acm;
        this.Author = author;
    }

    public getIcon() {
         return {
          light: path.join(this.acm._context.extensionPath, 'resources', `adaptivecards.png`),
          dark: path.join(this.acm._context.extensionPath, 'resources', `adaptivecards.png`),
      };


  }

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            description: this.Author,
            iconPath: this.getIcon(),
            contextValue: "ac-CardBase",
            command: {
                command: "cardListOnline.showElement",
                title: "",
                arguments: [this],
            }
        };
    }
    public async getChildren(context: vscode.ExtensionContext): Promise<INode[]> {

        try {
            var list: INode[] = [];
            list.push(new CardNodeChild("Template",this.path,"template",this.id,this.acm));
            list.push(new CardNodeChild("Data",this.path.replace(".ac",".acdata"),"data",this.id,this.acm));
            return list;
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }
    }

}
