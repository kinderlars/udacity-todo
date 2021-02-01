import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as XRay from 'aws-xray-sdk'
import {createLogger} from "../../utils/logger";

const logger = createLogger('getTodos')

const XAWS = XRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Processing event ${event}`)
  // TODO: Get all TODO items for a current user
  const todos = await docClient.scan({
    TableName: todosTable
  }).promise()

  const items = todos.Items

  return{
    statusCode: 200,
    body: JSON.stringify({
      items
    })
  }
}
