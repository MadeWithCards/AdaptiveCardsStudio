import * as vscode from "vscode";
import { scopes } from "./constants";
import * as fs from "fs";
import { isNullOrUndefined } from "util";
import * as path from "path";
import * as ACData from "adaptivecards-templating";
import { IEvaluationContext } from "adaptivecards-templating";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";


export class AdaptiveCardsAPIHelper {
    private readonly _extensionPath: string;
    private panel: vscode.WebviewPanel | undefined;
    public statusBarItem: vscode.StatusBarItem;
    public readonly _context: vscode.ExtensionContext;
    public userSession: vscode.AuthenticationSession;

    constructor(private context: vscode.ExtensionContext,extensionPath: string, session: vscode.AuthenticationSession) {
        this._context = context;
        this.context = context;
        this._extensionPath = extensionPath;
        this.userSession = session;
    }


    public async CheckAuthentication(): Promise<boolean> {

        const session = await vscode.authentication.getSession("microsoft", scopes, { createIfNone: false });
        if(session != null && !isNullOrUndefined(session.accessToken)) {
            this.userSession = session;
           return true;
        }

        vscode.window.showErrorMessage("You need to sign in before you can send a card");

        return false;
    }


    // tslint:disable-next-line: typedef
    public async SendToEmail(card: any, cardName: string) {
        // validate Session if not set
        if (this.userSession == null || isNullOrUndefined(this.userSession.accessToken)) {
            const session: vscode.AuthenticationSession =
                await vscode.authentication.getSession("microsoft", scopes, { createIfNone: true });
            if(session != null && !isNullOrUndefined(session.accessToken)) {
                this.userSession = session;
            } else {
                vscode.window.showErrorMessage("You need to login to your M365 Account first");
                return;
            }
        }

        var email: string = this.userSession.account.label;

        var cardPayload: any  = "<script type=\"application/adaptivecard+json\">";
        cardPayload += card.complete;
        cardPayload += "</script> <h3> Your Card JSON Layout </h3><br/><p>   ";
        cardPayload += card.card;
        cardPayload += "</p>";
        cardPayload += "</script> <h3> Your Card Sample Data </h3><br/><p>   ";
        cardPayload += card.data;
        cardPayload += "</p>";

        var emailData: any = {
            "message": {
                "subject": "AdaptiveCard Studio - Card",
                "body": {
                    "contentType": "html",
                    "content": `${cardPayload}`
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": `${email}`
                        }
                    }
                ]
            }
        }



        var axios: AxiosInstance = require("axios");
        axios.defaults.headers.common = {
            "Authorization": `Bearer ${this.userSession.accessToken}`};

        var result: AxiosResponse = await axios.post("https://graph.microsoft.com/v1.0/me/sendMail", emailData);

        if(result.status === 202) {
            vscode.window.showInformationMessage("You card was sent");
        } else {
            vscode.window.showErrorMessage("You card could not be sent, please try again");
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