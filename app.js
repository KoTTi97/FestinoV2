var restify = require('restify');
var builder = require('botbuilder');
var builder_cognitiveservices = require("botbuilder-cognitiveservices");

var card = {
    "contentType": "application/vnd.microsoft.card.adaptive",
    "content": {
        "type": "AdaptiveCard",
        "body": [{
            "type": "Container",
            "items": [{"type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "Help"}, {
                "type": "ColumnSet",
                "columns": [{
                    "type": "Column",
                    "items": [{
                        "type": "Image",
                        "horizontalAlignment": "Left",
                        "style": "Person",
                        "url": "https://www2.pic-upload.de/img/36024623/FestinoSupporterBot.png",
                        "size": "Large"
                    }],
                    "width": "auto"
                }, {
                    "type": "Column",
                    "items": [{
                        "type": "TextBlock",
                        "weight": "Bolder",
                        "text": "Hi, my name is Festino.",
                        "wrap": true
                    }, {
                        "type": "TextBlock",
                        "text": "I'm here to help you with SharePoint and Teams.",
                        "isSubtle": true,
                        "wrap": true
                    }, {
                        "type": "TextBlock",
                        "text": "You can choose the platform you need information for.",
                        "wrap": true
                    }, {
                        "wrap": true,
                        "type": "TextBlock",
                        "spacing": "none",
                        "text": "If you have a questions to another platform please type 'cancel' to leave the current context."
                    }],
                    "width": "stretch"
                }]
            }]
        }]
    }
};

var firstDialog = true;
var knowledgeBaseIDs = {
    sharePoint: "e612834d-f8a4-498a-80d0-373f48f60264",
    teams: "4d5edd0f-13c6-4af9-ab9c-d5167858a492"
};

var server = restify.createServer();
server.listen(3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});
var bot = new builder.UniversalBot(connector);

var qnaMakerTools = new builder_cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

server.post('/api/messages', connector.listen());

/*bot.on("conversationUpdate", (message) =>
{
    if (message.membersAdded[0].id === message.address.bot.id) {
        var reply = new builder.Message()
            .address(message.address)
            .text("Hi, my name is Festino! How can i help you?");
        bot.send(reply);
    }
});*/

var luisRecognizer = new builder.LuisRecognizer("https://westeurope.api.cognitive.microsoft.com/luis/v2.0/apps/5dbd3446-a86c-4819-b48b-d5f17e91b87e?subscription-key=6a71133fa1964f1b90fed95d8a7aa0e6&timezoneOffset=60&q=");
var teamsRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: knowledgeBaseIDs.teams,
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9",
    endpointHostName: "https://festinoqna.azurewebsites.net/qnamaker",
    top: 3
});
var teamsBasicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [teamsRecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.7,
    feedbackLib: qnaMakerTools
});
var sharePointRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: knowledgeBaseIDs.sharePoint,
    authKey: "d219649a-bd62-44b6-9baf-3df5c9024da9",
    endpointHostName: "https://festinoqna.azurewebsites.net/qnamaker",
    top: 3
});
var sharePointBasicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [sharePointRecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.7,
    feedbackLib: qnaMakerTools
});

bot.dialog('sharePointBasicQnAMakerDialog', sharePointBasicQnAMakerDialog);
bot.dialog('teamsBasicQnAMakerDialog', teamsBasicQnAMakerDialog);

bot.recognizer(luisRecognizer);

bot.dialog("/", [(session) =>
{
    if(firstDialog)
    {
        session.send("Hi, my name is Festino!");
    }
    builder.Prompts.choice(session, firstDialog ? "Which platform do you need help for?" :
        "Can I help you with you with something else?", "SharePoint|Teams",
        {listStyle: builder.ListStyle.button});
}, (session, result) =>
{
    session.beginDialog("CategorySelection", {category: result.response.entity});
}]);

bot.dialog("Goodbye", (session) =>
{
    session.send("luis goodbye");
}).triggerAction({
    matches: "Goodbye"
});

bot.dialog("CategorySelection", [(session, args) =>
{
    firstDialog = false;

    if(args.category === "SharePoint")
    {
        session.beginDialog("SharePointMain");
    }
    else if(args.category === "Teams")
    {
        session.beginDialog("TeamsMain");
    }
}, (session, result) =>
{
    session.replaceDialog("CategorySelection", {category: result.category});
}]);

bot.dialog("SharePointMain", [(session) =>
{
    builder.Prompts.text(session, "What do you want to know about SharePoint?");
}, (session, results) =>
{
    session.beginDialog('sharePointBasicQnAMakerDialog');
}, (session, result) =>
{
    session.endDialogWithResult({category: "SharePoint"})
}]);

bot.dialog("TeamsMain", [(session) =>
{
    builder.Prompts.text(session, "What do you want to know about Teams?");
}, (session, results) =>
{
    session.beginDialog('teamsBasicQnAMakerDialog');
}, (session, result) =>
{
    session.endDialogWithResult({category: "Teams"})
}]);





bot.dialog("Cancel", [(session) =>
{
    session.send("You now leave this context");
    session.replaceDialog("/");
}])
.triggerAction({
    matches: /^cancel$/i
});

bot.dialog("Help", [(session) =>
{
    firstDialog = false;
    var helpMsg = new builder.Message(session);
    helpMsg.addAttachment(card);
    session.send(helpMsg);
    session.replaceDialog("/");
}])
.triggerAction({
    matches: /^help$/i
});