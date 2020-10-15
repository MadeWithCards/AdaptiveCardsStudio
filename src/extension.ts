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

	context.subscriptions.push(acm);
	acm.Initialize();


	vscode.authentication.onDidChangeSessions(async e => {
		if (e.provider.id === "microsoft") {
			await acm.clearCredentials();
		}
	});


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


	vscode.commands.registerCommand("cardList.send", card => {
		acm.SendCard(card.path);
	});

    vscode.commands.registerTextEditorCommand("adaptivecard.open", (te, t) => {
        if (checkNoAdaptiveCard(te.document)) {
            return;
        }
		acm.OpenOrUpdatePanel("","");
    });


	let activeEditor: vscode.TextEditor = vscode.window.activeTextEditor;


	vscode.window.onDidChangeActiveTextEditor(
		editor => {
		  let auto = vscode.workspace.getConfiguration("acstudio").get("automaticallyOpen");
		  if(!auto || (acm.panel === undefined)) {return;}
		  if (checkNoAdaptiveCard(activeEditor.document,false)) {
			return;
		  }
		  activeEditor = editor;
		  acm.OpenOrUpdatePanel("","");
		},
		null,
		context.subscriptions
	  );

	  vscode.workspace.onDidChangeTextDocument(
		event => {
		  if (activeEditor && event.document === activeEditor.document &&
			acm.panel !== undefined && acm.panel.visible) {
			acm.OpenOrUpdatePanel("","");
		  }
		},
		null,
		context.subscriptions
	  );

	  function checkNoAdaptiveCard(document: vscode.TextDocument, displayMessage: boolean = true) {

		let isNGType = !(document.languageId === "json") || document.getText().indexOf("http://adaptivecards.io/schemas/adaptive-card.json") < 0;
		if (isNGType && displayMessage) {
			vscode.window.showWarningMessage("Active editor doesn't show a AdaptiveCard JSON document.");
		}
		return isNGType;
	}


}

// tslint:disable-next-line: typedef no-empty
export function deactivate() {}
