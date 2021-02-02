import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import {getTodo, updateTodo} from "../../businessLayer/todos";
import {parseUserId} from "../../auth/utils";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken)

  const result =getTodo(userId, todoId)

  if(result)
    return {
      statusCode:200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    }



  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  return {
    statusCode:200,
    body: JSON.stringify(result)
  }
}
