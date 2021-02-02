import {TodoItem} from "../models/TodoItem";
import {TodoAccess} from "../dataLayer/todoAccess";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";
import {TodoUpdate} from "../models/TodoUpdate";

const logger = createLogger('todos')
const todoAccess = new TodoAccess()

export async function getAllTodos(userId:string): Promise<TodoItem[]> {
  logger.info('Getting all todos')
  return todoAccess.getAllTodos(userId)
}

export async function getTodo(userId: string, todoId:string): Promise<TodoItem> {
  logger.info(`Getting todo ${todoId} for user ${userId}`)

  return await todoAccess.getTodo(userId,todoId)
}

export async function createTodo(userId: string,createTodoRequest: CreateTodoRequest): Promise<TodoItem> {

  const id = uuid.v4()
  const now = new Date().toISOString()

  const newItem: TodoItem = {
    userId: userId,
    todoId: id,
    createdAt: now,
    attachmentUrl: null,
    done: false,
    ...createTodoRequest
  }

  const result = await todoAccess.createTodo(newItem)

  logger.info(`New Todo create ${newItem}`)

  return result
}

export async function deleteTodo(userId: string, todoId: string): Promise<boolean> {

  const todo = await todoAccess.getTodo(userId,todoId)
  logger.info(`Return values of getTodo ${JSON.stringify(todo)}`)

  if(!todo)
    throw new Error('No item found')

  logger.info(`Todo ${JSON.stringify(todo)} for user ${userId} is prepared for deletion`)

  return await todoAccess.deleteTodo(todoId, userId)
}

export async function updateTodo(todoId: string, userId: string, updateTodoRequest: UpdateTodoRequest):Promise<boolean>{
  logger.info(`Trying to update todo ${todoId} for user ${userId} with payload ${JSON.stringify(updateTodoRequest)}`)

  const todo = await todoAccess.getTodo(userId,todoId)
  logger.info(`TODO ITEM: ${JSON.stringify(todo)}`)

  if(!todo)
    throw new Error('No item found')

  logger.info(`Starting update process`)

  const result = await todoAccess.updateTodo(todoId,userId,updateTodoRequest as TodoUpdate)

  return result

}



