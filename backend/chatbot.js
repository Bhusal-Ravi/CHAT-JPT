import OpenAI from "openai";
import dotenv from "dotenv";
import {tavily} from '@tavily/core'


dotenv.config();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function generate(userMessage){
       

        const messages=[
            {
                role:'system',
                content:`You are Jarvis, a small personal assistant, You can be rude, funny and taunt the user with your replies, You do not need to be formal with your replies, You can provide your answers as if friends are talking, You can joke around
               ⚠️ IMPORTANT:
                    - If the user asks for ANY real-time, current, or latest information (like weather, news, stock prices, recent events, today's data, etc), you MUST use the webSearch tool.
                    - For all other general knowledge or reasoning, you can reply directly,the current date and time is provided to you already.
                   

                You have access to following tools:
                    webSearch // search the leatest information on the internet
                
                
                current datetime and time:${new Date().toUTCString()}    `
            },
           
        ]

        
           
            messages.push({
                role:'user',
                content:userMessage
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

    if(!toolCalls ){
        console.log(response.choices[0].message)
        console.log(response.choices[0].message.content)
      return response.choices[0].message.content
    
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





async function webSearch({query}){
    console.log("Searching the Web")
    const response= await tvly.search(query)
    
    const finalResult = response.results.map(result=>result.content).join('\n\n')
    
    return finalResult
}