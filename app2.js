var restify = require('restify');
var builder = require('botbuilder');
var inMemoryStorage = new builder.MemoryBotStorage();
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () =>
{
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [(session, args, next) =>
{
    if (args.response.toLocaleLowerCase().includes("hello", "start", "hi"))
    {
        session.send("Hi my name is Festino, how can I help you ?");
        next();
    }
},
    (session) =>
    {
        builder.Prompts.choice(session, "On which platform are you having a problem? You have these options:",
            ["Sharepoint", "Teams"]);
    },
    (session, results) =>
    {
        if (results.response.toLocaleLowerCase().includes("sharepoint"))
        {
            builder.Prompts.choice(session, "You have these options:",
                ["List basket contents", "Add more products to the basket"]);
        }
        else if (results.response.toLocaleLowerCase().includes("teams"))
        {
            session.dialogData.actionChoice = "basket";
            builder.Prompts.choice(session, "You have these options:",
                ["List basket contents", "Add more products to the basket"])
        }
    }
    ]);
