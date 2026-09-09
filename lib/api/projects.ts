import { axiosClient, toApiError } from "../api"

export type ProjectStatus = "pending" | "approved" | "rejected"

export interface Project {
  _id: string
  name: string
  projectId: string
  projectAppUrl: string
  status: ProjectStatus
  ownerId: string | { _id: string; username?: string; uid?: string }
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface ListProjectsResponse {
  data: Project[]
}

export const listProjects = async (params?: { status?: ProjectStatus; owner?: string }) => {
  try {
    const { data } = await axiosClient.get<ListProjectsResponse>("/projects", { params })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const getProject = async (id: string) => {
  try {
    const { data } = await axiosClient.get<Project>(`/projects/${id}`)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const createProject = async (body: {
  name: string
  projectId: string
  projectAppUrl: string
  description?: string
}) => {
  try {
    const { data } = await axiosClient.post<Project>("/projects", body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export const updateProject = async (
  id: string,
  body: { name?: string; projectAppUrl?: string; description?: string; status?: ProjectStatus }
) => {
  try {
    const { data } = await axiosClient.patch<Project>(`/projects/${id}`, body)
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
