export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Absensi: {
        Row: {
          enter: string
          exit: string | null
          id: string
          isActive: boolean
          totalHour: string
          userId: string
        }
        Insert: {
          enter?: string
          exit?: string | null
          id: string
          isActive?: boolean
          totalHour?: string
          userId?: string
        }
        Update: {
          enter?: string
          exit?: string | null
          id?: string
          isActive?: boolean
          totalHour?: string
          userId?: string
        }
        Relationships: []
      }
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      Addon: {
        Row: {
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      AddonValue: {
        Row: {
          addon_id: string
          deleted: boolean
          id: string
          name: string
          price: number
        }
        Insert: {
          addon_id: string
          deleted?: boolean
          id: string
          name?: string
          price?: number
        }
        Update: {
          addon_id?: string
          deleted?: boolean
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "AddonValue_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "Addon"
            referencedColumns: ["id"]
          },
        ]
      }
      Attribute: {
        Row: {
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      CarouselSetting: {
        Row: {
          id: string
          imageUrl: string
        }
        Insert: {
          id: string
          imageUrl: string
        }
        Update: {
          id?: string
          imageUrl?: string
        }
        Relationships: []
      }
      CategorySetting: {
        Row: {
          id: string
          imageUrl: string
          name: string
          url: string
        }
        Insert: {
          id: string
          imageUrl: string
          name: string
          url: string
        }
        Update: {
          id?: string
          imageUrl?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      Cost: {
        Row: {
          deleted: boolean
          id: string
          name: string
          orderHistoryId: string
          type: string
          value: number
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
          orderHistoryId?: string
          type?: string
          value?: number
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
          orderHistoryId?: string
          type?: string
          value?: number
        }
        Relationships: []
      }
      Customer: {
        Row: {
          address: string
          age: number
          deleted: boolean
          id: string
          job: string
          name: string
          notes: string
          phone: string
        }
        Insert: {
          address?: string
          age?: number
          deleted?: boolean
          id: string
          job?: string
          name?: string
          notes?: string
          phone?: string
        }
        Update: {
          address?: string
          age?: number
          deleted?: boolean
          id?: string
          job?: string
          name?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
      CustomUser: {
        Row: {
          deleted: boolean
          id: string
          password: string
          roleId: string
          username: string
        }
        Insert: {
          deleted?: boolean
          id: string
          password?: string
          roleId?: string
          username?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          password?: string
          roleId?: string
          username?: string
        }
        Relationships: []
      }
      Discount: {
        Row: {
          deleted: boolean
          id: string
          name: string
          orderHistoryId: string
          type: string
          value: number
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
          orderHistoryId?: string
          type?: string
          value?: number
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
          orderHistoryId?: string
          type?: string
          value?: number
        }
        Relationships: []
      }
      ExitItem: {
        Row: {
          createdAt: string
          deleted: boolean
          hpp: number
          id: string
          isCustom: boolean
          isVendor: boolean
          materialId: string
          name: string
          newOrderId: string
          orderId: string
          pay: number
          price: number
          productId: string
          qty: number
          supplierId: string
          type: string
          variantId: string
        }
        Insert: {
          createdAt: string
          deleted: boolean
          hpp: number
          id: string
          isCustom: boolean
          isVendor: boolean
          materialId: string
          name: string
          newOrderId?: string
          orderId: string
          pay: number
          price: number
          productId: string
          qty: number
          supplierId: string
          type: string
          variantId: string
        }
        Update: {
          createdAt?: string
          deleted?: boolean
          hpp?: number
          id?: string
          isCustom?: boolean
          isVendor?: boolean
          materialId?: string
          name?: string
          newOrderId?: string
          orderId?: string
          pay?: number
          price?: number
          productId?: string
          qty?: number
          supplierId?: string
          type?: string
          variantId?: string
        }
        Relationships: []
      }
      Expense: {
        Row: {
          createdAt: string
          deletable: boolean
          deleted: boolean
          expense: number
          id: string
          notes: string
          targetId: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deletable?: boolean
          deleted?: boolean
          expense?: number
          id: string
          notes?: string
          targetId?: string
          type?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          deletable?: boolean
          deleted?: boolean
          expense?: number
          id?: string
          notes?: string
          targetId?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      ExpenseType: {
        Row: {
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      GallerySetting: {
        Row: {
          id: string
          imageUrl: string
        }
        Insert: {
          id: string
          imageUrl: string
        }
        Update: {
          id?: string
          imageUrl?: string
        }
        Relationships: []
      }
      Income: {
        Row: {
          createdAt: string | null
          deleted: boolean
          id: string
          income: number
          notes: string
          targetId: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          deleted?: boolean
          id: string
          income?: number
          notes?: string
          targetId?: string
          type?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string | null
          deleted?: boolean
          id?: string
          income?: number
          notes?: string
          targetId?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      IncomeType: {
        Row: {
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      IngoingStockType: {
        Row: {
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      Material: {
        Row: {
          aset: boolean
          costOfGoods: number
          deleted: boolean
          id: string
          name: string
          qty: number
          unit: string
        }
        Insert: {
          aset?: boolean
          costOfGoods?: number
          deleted?: boolean
          id: string
          name?: string
          qty?: number
          unit?: string
        }
        Update: {
          aset?: boolean
          costOfGoods?: number
          deleted?: boolean
          id?: string
          name?: string
          qty?: number
          unit?: string
        }
        Relationships: []
      }
      NewOrder: {
        Row: {
          createdAt: string
          customer_id: string
          deadline: string | null
          deleted: boolean
          driveUrl: string
          id: string
          notes: string
          order_status: string
          payment_status: string
          savedOrdersId: string[] | null
        }
        Insert: {
          createdAt?: string
          customer_id?: string
          deadline?: string | null
          deleted?: boolean
          driveUrl?: string
          id: string
          notes?: string
          order_status?: string
          payment_status?: string
          savedOrdersId?: string[] | null
        }
        Update: {
          createdAt?: string
          customer_id?: string
          deadline?: string | null
          deleted?: boolean
          driveUrl?: string
          id?: string
          notes?: string
          order_status?: string
          payment_status?: string
          savedOrdersId?: string[] | null
        }
        Relationships: []
      }
      Order: {
        Row: {
          created_at: string
          customer_id: string
          deadline: string | null
          deleted: boolean
          driveUrl: string
          id: string
          notes: string
          order_status: string
          payment_status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string
          deadline?: string | null
          deleted?: boolean
          driveUrl?: string
          id: string
          notes?: string
          order_status?: string
          payment_status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          deadline?: string | null
          deleted?: boolean
          driveUrl?: string
          id?: string
          notes?: string
          order_status?: string
          payment_status?: string
        }
        Relationships: []
      }
      OrderHistory: {
        Row: {
          created_at: string
          deleted: boolean
          id: string
          orderId: string
          paid: number
          payment_provider: string
          payment_type: string
          total: number
          totalAfterDiscount: number
          totalBeforeDiscount: number
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          id: string
          orderId?: string
          paid?: number
          payment_provider?: string
          payment_type?: string
          total?: number
          totalAfterDiscount?: number
          totalBeforeDiscount?: number
        }
        Update: {
          created_at?: string
          deleted?: boolean
          id?: string
          orderId?: string
          paid?: number
          payment_provider?: string
          payment_type?: string
          total?: number
          totalAfterDiscount?: number
          totalBeforeDiscount?: number
        }
        Relationships: []
      }
      OrderMaterial: {
        Row: {
          createdAt: string
          deleted: boolean
          id: string
          inOut: string
          materialId: string
          orderId: string
          pay: number
          qty: number
          supplierId: string
          type: string
        }
        Insert: {
          createdAt?: string
          deleted?: boolean
          id: string
          inOut?: string
          materialId?: string
          orderId?: string
          pay?: number
          qty?: number
          supplierId?: string
          type?: string
        }
        Update: {
          createdAt?: string
          deleted?: boolean
          id?: string
          inOut?: string
          materialId?: string
          orderId?: string
          pay?: number
          qty?: number
          supplierId?: string
          type?: string
        }
        Relationships: []
      }
      OrderProduct: {
        Row: {
          createdAt: string
          deleted: boolean
          id: string
          inOut: string
          orderId: string
          pay: number
          productId: string
          qty: number
          supplierId: string
          type: string
          variantId: string
        }
        Insert: {
          createdAt?: string
          deleted?: boolean
          id: string
          inOut?: string
          orderId?: string
          pay?: number
          productId?: string
          qty?: number
          supplierId?: string
          type?: string
          variantId?: string
        }
        Update: {
          createdAt?: string
          deleted?: boolean
          id?: string
          inOut?: string
          orderId?: string
          pay?: number
          productId?: string
          qty?: number
          supplierId?: string
          type?: string
          variantId?: string
        }
        Relationships: []
      }
      OrderVariant: {
        Row: {
          deleted: boolean
          id: string
          orderHistoryId: string
          price: number
          qty: number
          variant_id: string
        }
        Insert: {
          deleted?: boolean
          id: string
          orderHistoryId?: string
          price?: number
          qty?: number
          variant_id?: string
        }
        Update: {
          deleted?: boolean
          id?: string
          orderHistoryId?: string
          price?: number
          qty?: number
          variant_id?: string
        }
        Relationships: []
      }
      OrderVariantAddon: {
        Row: {
          addonValueId: string
          deleted: boolean
          id: string
          orderVariantId: string
          qty: number
        }
        Insert: {
          addonValueId?: string
          deleted?: boolean
          id: string
          orderVariantId?: string
          qty?: number
        }
        Update: {
          addonValueId?: string
          deleted?: boolean
          id?: string
          orderVariantId?: string
          qty?: number
        }
        Relationships: []
      }
      PopularProductSetting: {
        Row: {
          id: string
          productId: string
        }
        Insert: {
          id: string
          productId: string
        }
        Update: {
          id?: string
          productId?: string
        }
        Relationships: []
      }
      Product: {
        Row: {
          active: boolean
          base_price: number
          costOfGoods: number
          created_at: string
          deleted: boolean
          description: string
          id: string
          images: string[] | null
          name: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          costOfGoods?: number
          created_at?: string
          deleted?: boolean
          description?: string
          id: string
          images?: string[] | null
          name?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          costOfGoods?: number
          created_at?: string
          deleted?: boolean
          description?: string
          id?: string
          images?: string[] | null
          name?: string
        }
        Relationships: []
      }
      ProductAttribteValue: {
        Row: {
          attribute_id: string
          color: string
          deleted: boolean
          id: string
          image: string
          value: string
        }
        Insert: {
          attribute_id: string
          color?: string
          deleted?: boolean
          id: string
          image?: string
          value?: string
        }
        Update: {
          attribute_id?: string
          color?: string
          deleted?: boolean
          id?: string
          image?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProductAttribteValue_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "ProductAttribute"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductAttribute: {
        Row: {
          attribute_id: string
          deleted: boolean
          id: string
          product_id: string
        }
        Insert: {
          attribute_id: string
          deleted?: boolean
          id: string
          product_id: string
        }
        Update: {
          attribute_id?: string
          deleted?: boolean
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProductAttribute_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "Attribute"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductAttribute_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductToAddon: {
        Row: {
          addon_id: string
          deleted: boolean
          id: string
          product_id: string
        }
        Insert: {
          addon_id: string
          deleted?: boolean
          id: string
          product_id: string
        }
        Update: {
          addon_id?: string
          deleted?: boolean
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProductToAddon_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "Addon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductToAddon_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      ProductVariant: {
        Row: {
          costOfGoods: number
          deleted: boolean
          id: string
          name: string
          price: number
          product_id: string
          qty: number
        }
        Insert: {
          costOfGoods?: number
          deleted?: boolean
          id: string
          name?: string
          price?: number
          product_id: string
          qty?: number
        }
        Update: {
          costOfGoods?: number
          deleted?: boolean
          id?: string
          name?: string
          price?: number
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "ProductVariant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      ReceiptModel: {
        Row: {
          content: string
          deleted: boolean
          id: string
          name: string
        }
        Insert: {
          content?: string
          deleted?: boolean
          id: string
          name?: string
        }
        Update: {
          content?: string
          deleted?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      ReceiptSettings: {
        Row: {
          id: string
          model: string
        }
        Insert: {
          id: string
          model?: string
        }
        Update: {
          id?: string
          model?: string
        }
        Relationships: []
      }
      Role: {
        Row: {
          deleted: boolean
          id: string
          permissions: string[] | null
        }
        Insert: {
          deleted?: boolean
          id: string
          permissions?: string[] | null
        }
        Update: {
          deleted?: boolean
          id?: string
          permissions?: string[] | null
        }
        Relationships: []
      }
      SavedAddon: {
        Row: {
          addonId: string
          addonValueId: string
          deleted: boolean
          id: string
          name: string
          price: number
          savedOrderProductId: string
        }
        Insert: {
          addonId: string
          addonValueId: string
          deleted: boolean
          id: string
          name: string
          price: number
          savedOrderProductId: string
        }
        Update: {
          addonId?: string
          addonValueId?: string
          deleted?: boolean
          id?: string
          name?: string
          price?: number
          savedOrderProductId?: string
        }
        Relationships: []
      }
      SavedCost: {
        Row: {
          deleted: boolean
          id: string
          name: string
          savedOrderId: string
          type: string
          value: number
        }
        Insert: {
          deleted: boolean
          id: string
          name: string
          savedOrderId: string
          type: string
          value: number
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
          savedOrderId?: string
          type?: string
          value?: number
        }
        Relationships: []
      }
      SavedDiscount: {
        Row: {
          deleted: boolean
          id: string
          name: string
          savedOrderId: string
          type: string
          value: number
        }
        Insert: {
          deleted: boolean
          id: string
          name: string
          savedOrderId: string
          type: string
          value: number
        }
        Update: {
          deleted?: boolean
          id?: string
          name?: string
          savedOrderId?: string
          type?: string
          value?: number
        }
        Relationships: []
      }
      SavedOrder: {
        Row: {
          costsId: string[] | null
          creteadAt: string
          deleted: boolean
          discountsId: string[] | null
          gateway: string
          id: string
          method: string
          newOrderId: string
          paid: number
          savedOrderProductsId: string[] | null
          totalCosts: number
          totalDiscounts: number
          totalProducts: number
        }
        Insert: {
          costsId?: string[] | null
          creteadAt?: string
          deleted: boolean
          discountsId?: string[] | null
          gateway?: string
          id: string
          method?: string
          newOrderId: string
          paid?: number
          savedOrderProductsId?: string[] | null
          totalCosts?: number
          totalDiscounts?: number
          totalProducts?: number
        }
        Update: {
          costsId?: string[] | null
          creteadAt?: string
          deleted?: boolean
          discountsId?: string[] | null
          gateway?: string
          id?: string
          method?: string
          newOrderId?: string
          paid?: number
          savedOrderProductsId?: string[] | null
          totalCosts?: number
          totalDiscounts?: number
          totalProducts?: number
        }
        Relationships: []
      }
      SavedOrderProduct: {
        Row: {
          addon: string[] | null
          deleted: boolean
          discountName: string
          discountType: string
          discountValue: number
          id: string
          isCustom: boolean
          isDiscounted: boolean
          name: string
          price: number
          productId: string
          qty: number
          savedOrderId: string
          variantId: string
        }
        Insert: {
          addon?: string[] | null
          deleted: boolean
          discountName: string
          discountType: string
          discountValue: number
          id: string
          isCustom: boolean
          isDiscounted: boolean
          name: string
          price: number
          productId: string
          qty: number
          savedOrderId: string
          variantId: string
        }
        Update: {
          addon?: string[] | null
          deleted?: boolean
          discountName?: string
          discountType?: string
          discountValue?: number
          id?: string
          isCustom?: boolean
          isDiscounted?: boolean
          name?: string
          price?: number
          productId?: string
          qty?: number
          savedOrderId?: string
          variantId?: string
        }
        Relationships: []
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          impersonatedBy: string | null
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt: string
          expiresAt: string
          id: string
          impersonatedBy?: string | null
          ipAddress?: string | null
          token: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          impersonatedBy?: string | null
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      Supplier: {
        Row: {
          address: string
          deleted: boolean
          id: string
          name: string
          notes: string
          phone: string
        }
        Insert: {
          address?: string
          deleted?: boolean
          id: string
          name?: string
          notes?: string
          phone?: string
        }
        Update: {
          address?: string
          deleted?: boolean
          id?: string
          name?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
      SupplierContactPerson: {
        Row: {
          address: string
          age: number
          deleted: boolean
          id: string
          job: string
          name: string
          notes: string
          phone: string
          supplierId: string
        }
        Insert: {
          address?: string
          age?: number
          deleted?: boolean
          id: string
          job?: string
          name?: string
          notes?: string
          phone?: string
          supplierId?: string
        }
        Update: {
          address?: string
          age?: number
          deleted?: boolean
          id?: string
          job?: string
          name?: string
          notes?: string
          phone?: string
          supplierId?: string
        }
        Relationships: []
      }
      TestimonySetting: {
        Row: {
          id: string
          job: string
          name: string
          testimony: string
        }
        Insert: {
          id: string
          job: string
          name: string
          testimony: string
        }
        Update: {
          id?: string
          job?: string
          name?: string
          testimony?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          banExpires: string | null
          banned: boolean | null
          banReason: string | null
          createdAt: string
          displayUsername: string | null
          email: string
          emailVerified: boolean
          id: string
          image: string | null
          name: string
          role: string | null
          updatedAt: string
          username: string | null
        }
        Insert: {
          banExpires?: string | null
          banned?: boolean | null
          banReason?: string | null
          createdAt: string
          displayUsername?: string | null
          email: string
          emailVerified: boolean
          id: string
          image?: string | null
          name: string
          role?: string | null
          updatedAt: string
          username?: string | null
        }
        Update: {
          banExpires?: string | null
          banned?: boolean | null
          banReason?: string | null
          createdAt?: string
          displayUsername?: string | null
          email?: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          role?: string | null
          updatedAt?: string
          username?: string | null
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string | null
          value: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string | null
          value: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string | null
          value?: string
        }
        Relationships: []
      }
      WebsiteSetting: {
        Row: {
          address: string
          description: string
          facebook: string
          id: string
          instagram: string
          phone: string
          tiktok: string
          twitter: string
          youtube: string
        }
        Insert: {
          address: string
          description: string
          facebook: string
          id: string
          instagram: string
          phone: string
          tiktok: string
          twitter: string
          youtube: string
        }
        Update: {
          address?: string
          description?: string
          facebook?: string
          id?: string
          instagram?: string
          phone?: string
          tiktok?: string
          twitter?: string
          youtube?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_product_variants: {
        Args: { prev_variant_ids: string[]; current_variants: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
