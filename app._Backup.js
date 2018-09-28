/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var teamsKB = {
    knowledgeBaseId: "4d5edd0f-13c6-4af9-ab9c-d5167858a492",
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9", // Backward compatibility with QnAMaker (Preview)
    endpointHostName: "https://festinoqna.azurewebsites.net/qnamaker"
};
var sharePointKB = {
    knowledgeBaseId: "e612834d-f8a4-498a-80d0-373f48f60264",
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9", // Backward compatibility with QnAMaker (Preview)
    endpointHostName: "https://festinoqna.azurewebsites.net/qnamaker"
};

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

/*var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);*/

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
//bot.set('storage', tableStorage);
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.send(new builder.Message()
                    .address(message.address)
                    .text("Hello!  I'm Festino how can i help you?"));
            }
        });
    }
});

// Recognizer and and Dialog for preview QnAMaker service
var previewRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: "4d5edd0f-13c6-4af9-ab9c-d5167858a492",
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9"
});



var basicQnAMakerPreviewDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [previewRecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
});

bot.dialog('basicQnAMakerPreviewDialog', basicQnAMakerPreviewDialog);

// Recognizer and and Dialog for GA QnAMaker service
var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: "4d5edd0f-13c6-4af9-ab9c-d5167858a492",
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9", // Backward compatibility with QnAMaker (Preview)
    endpointHostName: "https://festinoqna.azurewebsites.net/qnamaker"
});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
});

bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

bot.dialog('/', //basicQnAMakerDialog);
    [
        function (session) {
            var qnaKnowledgebaseId = "4d5edd0f-13c6-4af9-ab9c-d5167858a492";
            var qnaAuthKey = "d219649a-bd62-44b6-9baf-3df5c9024da9";
            var endpointHostName = "https://festinoqna.azurewebsites.net/qnamaker";

            // QnA Subscription Key and KnowledgeBase Id null verification
            if ((qnaAuthKey == null || qnaAuthKey === '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId === ''))
                session.send('Please set QnAKnowledgebaseId, QnAAuthKey and QnAEndpointHostName (if applicable) in App Settings. Learn how to get them at https://aka.ms/qnaabssetup.');
            else {
                if (endpointHostName == null || endpointHostName === '')
                    // Replace with Preview QnAMakerDialog service
                    session.replaceDialog('basicQnAMakerPreviewDialog');
                else
                    // Replace with GA QnAMakerDialog service
                    session.replaceDialog('basicQnAMakerDialog');
            }
        }
    ]);
