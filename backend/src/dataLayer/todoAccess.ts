import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from "../models/TodoItem";
import {createLogger} from '../utils/logger'
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";

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

  async getTodo(userId: string, todoId: string): Promise<TodoItem>{
    logger.info(`Getting todo item ${todoId} of user ${userId}`)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      }
    }).promise()

    const item = result.Item
    return item as TodoItem
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo ${todo}`)
    await this.docClient.put({
      TableName: this.todosTable,

      Item: todo
    }).promise()

    return todo
  }

  async deleteTodo(todoId: string,userId: string):Promise<boolean>{
    logger.info(`Deleting Todo ${todoId}`)
    logger.info(`Provided parameters user: ${userId} and todoid: ${todoId}`)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      }
    }).promise()

    return true
  }

  async updateTodo(todoId: string,userId: string, updateTodoRequest: UpdateTodoRequest): Promise<boolean> {
    logger.info(`Update process in data layer`)

    // Use # when using reserved keywords
    // https://stackoverflow.com/questions/36698945/scan-function-in-dynamodb-with-reserved-keyword-as-filterexpression-nodejs
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": updateTodoRequest.name,
        ":dueDate": updateTodoRequest.dueDate,
        ":done": updateTodoRequest.done
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()


    return true
  }

  async updateAttachmentUrl(todoId: string,userId: string,attachmentUrl: string){
    logger.info(`Updating attachment url ${attachmentUrl} in database table for todo ${todoId} owned by user ${userId}`)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: "set attachmentUrl = :url",
      ExpressionAttributeValues: {
        ":url": attachmentUrl
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()
  }
}
