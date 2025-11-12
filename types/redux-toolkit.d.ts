declare module "@reduxjs/toolkit" {
  export type PayloadAction<P = any> = { type: string; payload: P }
  export function configureStore(options: any): any
  export function createSlice(options: any): any
  export function createAsyncThunk(typePrefix: string, payloadCreator: any): any
}
