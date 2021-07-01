import * as vscode from "vscode";
import { INode } from "./nodes/INode";
import { ProjectErrorNode } from "./nodes/ProjectErrorNode";
import axios from "axios";
import { Card, CardListResponse } from "./AdaptiveOnlineEntry";
import { AdaptiveCardsMain } from "../adaptiveCards";
import * as path from 'path';
import { CardNodeOnlineChild } from "./CardNodeOnlineChild";

export class CardNodeOnline implements INode {

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
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
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
                var items: INode[] = [];
                var config = vscode.workspace.getConfiguration('acstudio');
                var listUri: string = `https://api.madewithcards.io/cards?skip=0&top=100&mode=full&category=${this.id}`;
                var token: string = "..."; //config.get("onlineAccessToken");
        
                if(token !== ""){
                    await axios.get(listUri)
                      .then((res) => {
                        console.log("ACSTUDIO - Found Online Nodes");
                         var response : CardListResponse = res.data;
                          var i: number = 0;
                          response.cards.forEach(element  => {
                            var node = new CardNodeOnlineChild(
                                element.name,
                                element.id, i,
                                "MadeWithCards",
                                 this.acm);
                            this.acm.templates.push(element);
                            i++;
                            items.push(node);
                          });
                          console.log("Loaded Items");
                          return items;
                      })
                      .catch((error) => {
                        console.log(error);
                        items.push(new ProjectErrorNode("Online Access not available",error,"",1));
                        return items;
                      });
                  } else {
                    items.push(new ProjectErrorNode("Online Access not available","","",1));
                  }
                  return items;
          } catch (error) {
              vscode.window.showErrorMessage(error);
              return [];
        }
    }

}
