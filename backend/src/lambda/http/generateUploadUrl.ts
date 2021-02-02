import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import {getS3UploadUrl, getTodo, updateAttachmentUrl} from '../../businessLayer/todos';
import {parseUserId} from "../../auth/utils";

import {createLogger} from "../../utils/logger";
import * as uuid from 'uuid'


const logger = createLogger('url-generator')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  logger.info(`Get presigned url for todo ${todoId}`)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken)

  const validTodo = await getTodo(userId, todoId)


  if(!validTodo) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: "No matching todo found!"
      })
    }
  }
  logger.info(`Provided todo id ${todoId} seems to return valid outout ${JSON.stringify(validTodo)}`)

  const imageId = uuid.v4()
  const presignedUrl = await getS3UploadUrl(imageId)
  logger.info(`The presigned url created ${JSON.stringify(presignedUrl)}`)

  const updatedTodo = await updateAttachmentUrl(todoId,userId,imageId)
  logger.info(`Updated object ${JSON.stringify(updatedTodo)}`)

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  return {
    statusCode:200,
    body: `{"uploadUrl": "${presignedUrl}"}`
  }
}

