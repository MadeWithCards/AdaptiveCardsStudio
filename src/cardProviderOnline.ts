import * as vscode from "vscode";
import {INode} from "./model/nodes/INode";
import { ProjectErrorNode } from "./model/nodes/ProjectErrorNode";
import { CardNodeOnline } from "./model/CardNodeOnline";
import { AdaptiveCardsMain } from "./adaptiveCards";
import { Card, CardListResponse } from "./model/AdaptiveOnlineEntry";
import axios from "axios";

export class CardProviderOnline implements vscode.TreeDataProvider<INode> {
    private readonly acm: AdaptiveCardsMain;

    public _onDidChangeTreeData: vscode.EventEmitter<INode | void> = new vscode.EventEmitter<INode | void>();
    public readonly onDidChangeTreeData: vscode.Event<INode | void> = this._onDidChangeTreeData.event;

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
        if(!element) {
            console.log("ACSTUDIO - Get Online Nodes");
            vscode.window.showInformationMessage("Loading online example cards");
            return await this.GetCardsFromOnline();

        }
        return element.getChildren(this.context);
    }

    public async GetCardsFromOnline() : Promise<INode[]> {
        var items: INode[] = [];

        var config = vscode.workspace.getConfiguration('acstudio');
        var listUri: string = "https://api.madewithcards.io/cards?skip=0&top=100&mode=full";
        var token: string = "..."; //config.get("onlineAccessToken");

        if(token !== ""){
            await axios.get(listUri, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              .then((res) => {
                console.log("ACSTUDIO - Found Online Nodes");
                 var response : CardListResponse = res.data;
                  var i: number = 0;
                  response.cards.forEach(element  => {
                    var node = new CardNodeOnline(
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
    }


    public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem  {
        return element.getTreeItem();
    }

}