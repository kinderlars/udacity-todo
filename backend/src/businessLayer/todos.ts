import {TodoItem} from "../models/TodoItem";
import {TodoAccess} from "../dataLayer/todoAccess";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'

const logger = createLogger('todos')
const todoAccess = new TodoAccess()

export async function getAllTodos(userId:string): Promise<TodoItem[]> {
  logger.info('Getting all todos')
  return todoAccess.getAllTodos(userId)
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
  if(!todo)
    throw new Error('No item found')

  logger.info(`Todo ${JSON.stringify(todo)} for user ${userId} is prepared for deletion`)

  return await todoAccess.deleteTodo(todoId, userId)
}




