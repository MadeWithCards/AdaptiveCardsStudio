import * as sendmail from 'sendmail'

export function ShareByEmail(email: string, carddata: string){

    const sendmail = require('sendmail')()


    var content = '<p>Here is your Adaptive Card </p><script type="application/adaptivecard+json"> { { "type": "AdaptiveCard", "body": [ { "type": "Container", "items": [ { "type": "TextBlock", "text": "This example uses [Adaptive Card Templating](https://docs.microsoft.com/en-us/adaptive-cards/templating/)", "size": "Medium", "wrap": true }, { "type": "TextBlock", "text": "Click the **Preview mode** toolbar button to see the card bound to the **Sample Data** in the lower-right. Sample Data helps design your card by simulating the real data.", "wrap": true }, { "type": "TextBlock", "text": "When youre ready to populate it with real data, use the Adaptive Card [templating SDKs](https://docs.microsoft.com/en-us/adaptive-cards/templating/sdk).", "wrap": true } ], "style": "good", "bleed": true }, { "type": "TextBlock", "size": "Medium", "weight": "Bolder", "text": "${title}" }, { "type": "ColumnSet", "columns": [ { "type": "Column", "items": [ { "type": "Image", "style": "Person", "url": "${creator.profileImage}", "size": "Small" } ], "width": "auto" }, { "type": "Column", "items": [ { "type": "TextBlock", "weight": "Bolder", "text": "${creator.name}", "wrap": true }, { "type": "TextBlock", "spacing": "None", "text": "Created {{DATE(${createdUtc},SHORT)}}", "isSubtle": true, "wrap": true } ], "width": "stretch" } ] }, { "type": "TextBlock", "text": "${description}", "wrap": true }, { "type": "FactSet", "facts": [ { "$data": "${properties}", "title": "${key}:", "value": "${value}" } ] } ], "actions": [ { "type": "Action.ShowCard", "title": "Set due date", "card": { "type": "AdaptiveCard", "body": [ { "type": "Input.Date", "id": "dueDate" }, { "type": "Input.Text", "id": "comment", "placeholder": "Add a comment", "isMultiline": true } ], "actions": [ { "type": "Action.Submit", "title": "OK" } ], "$schema": "http://adaptivecards.io/schemas/adaptive-card.json" } }, { "type": "Action.OpenUrl", "title": "View", "url": "${viewUrl}" } ], "$schema": "http://adaptivecards.io/schemas/adaptive-card.json", "version": "1.3" } } </script>';
    sendmail({
      from: 'no-reply@yourdomain.com',
      to: 't.cadenbach@efexcon.com',
      subject: 'Adative Card Share',
      html: "huhu here i am",
    }, function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    });

}

