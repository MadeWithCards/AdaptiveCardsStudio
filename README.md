![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/madewithcardsio.adaptivecardsstudiobeta)
![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/madewithcardsio.adaptivecardsstudiobeta)

![AC Studio ](https://madewithcards.blob.core.windows.net/uploads/29bb3d02-2158-40b8-8420-4dd1f15da34c-acstudio.png)

## Features

With AdaptiveCards Studio you can author cards directly in Visual Studio Code. The Extension automatically detects all Adaptive Cards in your working space and lets you easily edit the card template and sample data.

## Extension Settings

To use the Extension you must configure it first!

This extension contributes the following settings:

-   `acstudio.defaultHostConfig`  : The HostConfig to be used when rendering cards

## Usage

Open the Adaptive Cards Panel and select a card.... thats all you have to do :)

## Testing Cards

Login to your M365 account, click the outlook icon to send the card to yourself by email. 

## Snippets

The Extension comes with various snippets to make authoring cards even easier. Just press ctrl+space anywhere in the AdaptiveCard Json

Snippets for Adaptive Cards Elements:
-   `ac-txt`  : TextBlock with minimum properties
-   `ac-txtfull`  : TextBlock with all properties
-   `ac-col3`  : Columnset with 3 columns
-   `ac-col2`  : Columnset with 2 columns
-   `ac-fctset`  : Factset
-   `ac-ctr`  : Container
-   `ac-img`  : Image

Snippets for Adaptive Card Samples:
-   `ac-empty`  : A new, blank AdaptiveCard
-   `ac-activityUpdate`  : Adaptive Cards Activity Update Sample
-   `ac-expenseReport`  : Adaptive Cards Expense Report Sample
-   `ac-inputForm`  : Adaptive Cards Input Form Sample


## SampleData

When editing templates its a tremendous help to have sample data available. The Extension lets you create and store sample data for your templates easily.

## CMS Usage

The CMS interoperability is in alpha preview, to connect the extension to your self hosted CMS set the config values above to your URL and access token. The only way to get an access token right now is using developer tools in your browser and inspecting the calls when logged in to your CMS. This is an alpha proof of concept and will have a proper login mechanism soon.