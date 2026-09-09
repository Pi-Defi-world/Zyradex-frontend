import { axiosClient } from "../api"

export const approvePiPayment = async (paymentId: string) => {
  const { data } = await axiosClient.post("/pi/payments/approve", { paymentId })
  return data
}

export const completePiPayment = async (
  paymentId: string,
  txid: string,
  donationData?: { userId: string; amount: number; memo: string; metadata?: Record<string, unknown> }
) => {
  const { data } = await axiosClient.post("/pi/payments/complete", {
    paymentId,
    txid,
    donationData,
  })
  return data
}

export const cancelPiPayment = async (paymentId: string) => {
  await axiosClient.post("/pi/payments/cancel", { paymentId })
}
