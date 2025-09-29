import OpenAI from "openai";
import dotenv from "dotenv";
import {tavily} from '@tavily/core'
import readline from 'node:readline/promises'

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function main(){
        const rl= readline.createInterface({input:process.stdin,output:process.stdout})

     const messages=[
            {
                role:'system',
                content:`You are Jarvis, a small personal assistant,
               ⚠️ IMPORTANT:
                    - If the user asks for ANY real-time, current, or latest information (like weather, news, stock prices, recent events, today's data, etc), you MUST use the webSearch tool.
                    - For all other general knowledge or reasoning, you can reply directly,the current date and time is provided to you already.

                You have access to following tools:
                    1 webSearch({query}):(query:string) // search the leatest information on the internet
                
                
                current datetime and time:${new Date().toUTCString()}    `
            },
           
        ]

        while(true){
            const question = await rl.question('You: ')
            if (question=='bye') break;
            messages.push({
                role:'user',
                content:question
            })
            while(true){
            const response=await client.chat.completions.create({
        temperature:0.1,
        
        tools:[
                {
                        type: "function",
                        function: {
                            name: "webSearch",
                            description: "Search the web for real-time, current, or latest information the model may not know.",
                            parameters: {
                            type: "object",
                            properties: {
                                query: {
                                type: "string",
                                description: "The search query to perform search on."
                                },
                                
                            },
                            "required": ["query"]
                            }
                        }
                        }   
        ],
        tool_choice:'auto',
        model: 'llama-3.3-70b-versatile',
        
        messages:messages
        
    })

    messages.push(response.choices[0].message)
    const toolCalls= response.choices[0].message.tool_calls

    if(!toolCalls){
        console.log('Assistant: ',response.choices[0].message.content, '\n\n')
        break;
    }


    for(const tool of toolCalls){
        
        const functionName=tool.function.name;
        const functionParams= tool.function.arguments;

        if(functionName==='webSearch'){
          const result= await webSearch(JSON.parse(functionParams))
            messages.push(
                {
                    tool_call_id:tool.id,
                    role:'tool',
                    name:functionName,
                    content:result
                }
            )
        }
    }

    

    

        }
        }
    

    rl.close()
}

main()



async function webSearch({query}){
    console.log("Searching the Web")
    const response= await tvly.search(query)
    
    const finalResult = response.results.map(result=>result.content).join('\n\n')
    
    return finalResult
}