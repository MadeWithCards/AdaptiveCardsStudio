"use strict";

import * as vscode from "vscode";
import { CardProvider } from "./cardProvider";
import { CardProviderCMS } from "./CardProviderCMS";
import { AdaptiveCardsMain } from "./adaptiveCards";



// tslint:disable-next-line: typedef no-empty
export function activate(context: vscode.ExtensionContext) {
	const acm : AdaptiveCardsMain = new AdaptiveCardsMain(context,context.extensionPath);
	const cardProvider : CardProvider = new CardProvider(context,acm);
	const cardProviderCMS : CardProviderCMS = new CardProviderCMS(context,acm);
	vscode.window.registerTreeDataProvider("cardList", cardProvider);
	vscode.window.registerTreeDataProvider("cardListCMS", cardProviderCMS);


	// register authentication provider
	const scope = ['user:email'];
	context.subscriptions.push(vscode.commands.registerCommand(
	  "cardList.refresh",
	  async () => {
		let token;

		const result = await vscode.authentication.getSessions("microsoft", scope);
		if (!result.length) {
		  const session = await vscode.authentication.login("microsoft", scope);
		  token = await session.getAccessToken();
		} else {
		  token = await result[0].getAccessToken();
		}

		console.log(result);
		vscode.window.showInformationMessage(`Got token ${token}`);
	  }
	));


	// register Url Handler for App
	vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
			if(uri.toString().indexOf("adaptivecards") > 0) {
				var cardId: string = uri.path.replace("/","");
				acm.OpenRemoteCard(cardId);
			} else {
				// noting for us, just ignore
			}
        }
    });

	// vscode.commands.registerCommand("cardList.refresh", task => {
	// 	cardProvider.refresh();
	// 	}
	// );

	vscode.commands.registerCommand("cardListCMS.refresh", task => {
		cardProviderCMS.refresh();
		}
	);

	vscode.commands.registerCommand("cardList.showElement", card  => {
		acm.OpenCard(card.path);
	});

	vscode.commands.registerCommand("cardListCMS.showElement", card  => {
		acm.OpenCardCMS(card.path);
	});

	let activeEditor: vscode.TextEditor = vscode.window.activeTextEditor;


	vscode.window.onDidChangeActiveTextEditor(
		editor => {
		  activeEditor = editor;
		  acm.OpenOrUpdatePanel("","");
		},
		null,
		context.subscriptions
	  );

	  vscode.workspace.onDidChangeTextDocument(
		event => {
		  if (activeEditor && event.document === activeEditor.document) {
			acm.OpenOrUpdatePanel("","");
		  }
		},
		null,
		context.subscriptions
	  );

}

// tslint:disable-next-line: typedef no-empty
export function deactivate() {}
