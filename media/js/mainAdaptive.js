// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
       const vscode = acquireVsCodeApi();
       $(document).ready(function(){
         try {
            // Create an AdaptiveCard instance
            var adaptiveCard = new AdaptiveCards.AdaptiveCard();

            var cardHostConfig = $('#divConfig').text();
            adaptiveCard.hostConfig = new AdaptiveCards.HostConfig(JSON.parse(cardHostConfig));
        
            // Adaptive Cards - Actions
            adaptiveCard.onExecuteAction = function (action) {
                  vscode.postMessage({
                     command: 'action',
                     text: JSON.stringify(action._processedData)
                 })
            };

            var cardPayload = $('#divData').text();
            // Parse the card payload
            adaptiveCard.parse(JSON.parse(cardPayload));

            // Render the card to an HTML element:
            var renderedCard = adaptiveCard.render();

            $('#cardHost').append(renderedCard).show();

            $('#shareOutlook').on('click',function(){
               vscode.postMessage({
                    command: 'action',
                    text: 'sendEmail'
                })     
            })

            $('#shareTeams').on('click',function(){
               vscode.postMessage({
                    command: 'action',
                    text: 'sendTeams'
                })     
            })


            $('#shareCard').on('click',function(){
               vscode.postMessage({
                    command: 'action',
                    text: 'shareCard'
                })     
            })
         } catch(ex) {
            $('#cardHost').append(ex)
            $('#cardHost vivaConnectionsContainer').append(ex)
            $('#cardHost widget-small-card').append(ex)
         }   
       })

}());