import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from "../models/TodoItem";
import {createLogger} from '../utils/logger'

const logger = createLogger('todo-access')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {

  constructor(
      private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly todosTable: string = process.env.TODOS_TABLE,
      private readonly todoIndexByUserId = process.env.TodoIndexByUserId
  ){}

  async getAllTodos(userId:string): Promise<TodoItem[]> {
    logger.info(`Starting DynamoDB query on table ${this.todosTable}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todoIndexByUserId,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }

    }).promise()

    logger.info(`Scan return values ${result}`)
    const items = result.Items

    logger.info(`Query return ${items}`)
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo ${todo}`)
    await this.docClient.put({
      TableName: this.todosTable,

      Item: todo
    }).promise()

    return todo
  }


}
