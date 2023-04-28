import * as path from "path";
import * as vscode from "vscode";
import * as ACData from "adaptivecards-templating";
import * as fs from "fs";
import { IEvaluationContext } from "adaptivecards-templating";


export class WebViews {
    private readonly _extensionPath: string;
    public readonly _context: vscode.ExtensionContext;

    constructor(private context: vscode.ExtensionContext,extensionPath: string) {
        this._context = context;
        this._extensionPath = extensionPath;
    }

    public async GetWebViewContentAdaptiveCard(cardContent: string, cardData: string, panel: vscode.WebviewPanel) {
        let editor = vscode.window.activeTextEditor;

        if (editor) {
        let template = new ACData.Template(cardContent);
        var context : IEvaluationContext = {$root: JSON.parse(cardData)};
        var cardToRender = template.expand(context);


        // Lets pick the host config to use from the settings
        var config = vscode.workspace.getConfiguration('acstudio');
        var configName: string = config.get("defaultHostConfig");

        var hostConfig = fs.readFileSync(path.join(this._extensionPath, "media/js/hostConfigs", configName + ".json"), "ascii");

        // local path to main script run in the webview
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "mainAdaptive.js"));

        // jquery
        const jqueryUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "jquery.min.js"));

        const ACUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "adaptivecards.min.js"));

        const ACTemplatingUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "adaptivecards-templating.min.js"));

        const ACExpressionsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "browser.min.js"));
              
        const MarkdownUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/js", "markdown-it.min.js"));

        const mainstyleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/css/additional", configName + ".css"));

        const ACStyleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/css", "editormain.css"));

        const fabricUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/css", "fabric.min.css"));
        
        const carouselUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "media/css", "adaptivecards-carousel.css"));

        const nonce = this.getNonce();


        var designerTemplate: string = "";

        if (configName.indexOf("teams") > 0) {
            designerTemplate = `<div class="teams-frame flex-item">
                            <div class="teams-hexagon-outer"></div>
                            <div class="teams-inner-frame">
                                <div class="teams-botNameAndTime">Test Bot  2:36 PM</div>
                                <div id="cardHost"></div>
                            </div>
                        </div>`;
        }
        else if (configName.indexOf("widget") === 0) {
            designerTemplate = `<div class="widget-outer-container widget-small-container flex-item">
                            <div class="widget-header"> <p class="widget-header-text">WidgetHeader</p</div>
                            <div class="widget-inner-container">
                                <div id=" widget-small-card">
                                    <div id="cardHost"></div>
                                </div>
                            </div>
                        </div>`;
        }
        else if (configName.indexOf("viva") === 0) {
            designerTemplate = `<div class="vivaConnectionsContainer flex-item">
                            <div id="cardHost"></div>
                        </div>`;
        }
        else if (configName.indexOf("web") > 0) {
            designerTemplate = `<div class="webChatInnerContainer flex-item">
                                    <div id="cardHost"></div>
                                </div>`;
        }


        if ( designerTemplate === "" ) {
          designerTemplate = `<div id="cardHost" class='flex-item'></div>`;
        }

        return {
            card : {
                card: cardContent,
                data: cardData,
                complete: cardToRender,
            },
            html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cat Coding</title>
                    <meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">

                    <link rel="stylesheet" href="${mainstyleUri}"  nonce="${nonce}"  type="text/css" />
                    <link rel="stylesheet" href="${ACStyleUri}"  nonce="${nonce}"  type="text/css" />
                    <link rel="stylesheet" href="${fabricUri}"  nonce="${nonce}"  type="text/css" />
                    <link rel="stylesheet" href="${carouselUri}"  nonce="${nonce}"  type="text/css" />

                    <style type="text/css">
                    code {
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                      }
                      .iconSmall {
                        height:24px;
                        width:24px;
                      }
                      .button {
                        padding:5px;
                        transition: 0.3s;
                      }
                      .button:hover {
                        background:lightgray;
                        border-radius: 5px 5px 5px 5px;
                        -moz-border-radius: 5px 5px 5px 5px;
                        -webkit-border-radius: 5px 5px 5px 5px;
                        border: 0px outset #7d7d7d;
                        transition: 0.3s;
                        cursor:pointer;
                      }

                      .flex-container {
                        display: -ms-flexbox;
                        display: -webkit-flex;
                        display: flex;
                        -webkit-flex-direction: column;
                        -ms-flex-direction: column;
                        flex-direction: column;
                        -webkit-flex-wrap: nowrap;
                        -ms-flex-wrap: nowrap;
                        flex-wrap: nowrap;
                        -webkit-justify-content: flex-start;
                        -ms-flex-pack: start;
                        justify-content: flex-start;
                        -webkit-align-content: stretch;
                        -ms-flex-line-pack: stretch;
                        align-content: stretch;
                        -webkit-align-items: flex-start;
                        -ms-flex-align: start;
                        align-items: flex-start;
                        }

                    .flex-item:nth-child(1) {
                        -webkit-order: 0;
                        -ms-flex-order: 0;
                        order: 0;
                        -webkit-flex: 0 1 auto;
                        -ms-flex: 0 1 auto;
                        flex: 0 1 auto;
                        -webkit-align-self: flex-end;
                        -ms-flex-item-align: end;
                        align-self: flex-end;
                        }

                        .flex-item:nth-child(2) {
                            -webkit-order: 0;
                            -ms-flex-order: 0;
                            order: 0;
                            -webkit-flex: 0 1 auto;
                            -ms-flex: 0 1 auto;
                            flex: 0 1 auto;
                            -webkit-align-self: flex-start;
                            -ms-flex-item-align: start;
                            align-self: flex-start;
                            }
                    </style>
                </head>
                <body class='code'>
                    <div class='flex-container' style='margin-top:5px;'>
                        <div class='flex-item' style='display:flex;flex-direction:row;padding:5px;'>
                            <div class='button' style='margin-right:10px;' ><div id="shareOutlook" class="iconSmall ms-BrandIcon--icon96 ms-BrandIcon--outlook"></div></div>
                            <div class='button' style='display:none'><div id="shareTeams" class="iconSmall ms-BrandIcon--icon96 ms-BrandIcon--teams"></div></div>
                        </div>
                    </div>

                    ${designerTemplate}
                    <div id="out"></div>
                    <script nonce="${nonce}" src="${jqueryUri}"></script>

                    <script nonce="${nonce}" src="${ACUri}"></script>
                    <script nonce="${nonce}" src="${ACTemplatingUri}"></script>
                    <script nonce="${nonce}" src="${ACExpressionsUri}"></script>

                    <script nonce="${nonce}" src="${MarkdownUri}"></script>
                    <script nonce="${nonce}" src="${scriptUri}"></script>
                    <div id="divConfig" style='display:none;'>
                        ${hostConfig}
                    </div>
                    <div id="divData" style='display:none;'>
                        ${cardToRender}
                    </div>
                </body>
                </html>`};
        }
    }

    private getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }


}