"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

// Data model as specified
export interface Order {
  id: string
  desc: string
  userName: string
  status: "ordering" | "decided" | "cooking" | "finished"
}

// Hook contract as specified
interface OrdersContextType {
  orders: Order[]
  setAsCooking: (orderId: string) => void
  setAsFinished: (orderId: string) => void
  removeOrder: (orderId: string) => void
}

// Create context
const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

// Sample data
const sampleOrders: Order[] = [
  {
    id: "order-1",
    desc: "Pasta Carbonara with extra cheese",
    userName: "Alex",
    status: "ordering",
  },
  {
    id: "order-2",
    desc: "Margherita Pizza, no basil",
    userName: "Jamie",
    status: "decided",
  },
  {
    id: "order-3",
    desc: "Chicken Caesar Salad, dressing on the side",
    userName: "Taylor",
    status: "cooking",
  },
  {
    id: "order-4",
    desc: "Chocolate Lava Cake with vanilla ice cream",
    userName: "Morgan",
    status: "finished",
  },
  {
    id: "order-5",
    desc: "Vegetable Stir Fry, spicy",
    userName: "Casey",
    status: "decided",
  },
]

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(sampleOrders)

  // Implementation of the hook functions
  const setAsCooking = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && (order.status === "ordering" || order.status === "decided")
          ? { ...order, status: "cooking" }
          : order,
      ),
    )
  }

  const setAsFinished = (orderId: string) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId && order.status === "cooking" ? { ...order, status: "finished" } : order,
      ),
    )
  }

  const removeOrder = (orderId: string) => {
    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId))
  }

  return (
    <OrdersContext.Provider value={{ orders, setAsCooking, setAsFinished, removeOrder }}>
      {children}
    </OrdersContext.Provider>
  )
}

// Custom hook to use the orders context
export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return context
}
