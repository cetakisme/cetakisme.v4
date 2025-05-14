import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useKasir } from "./useKasir";
import { generateId } from "@/server/local/utils";

const formSchema = z.object({
  name: z.string().min(1),
  qty: z
    .string()
    .min(1)
    .refine((x) => !isNaN(+x)),
  price: z
    .string()
    .min(1)
    .refine((x) => !isNaN(+x)),
});

export const CustomForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      qty: "",
      price: "",
    },
  });

  const addProduct = useKasir((s) => s.addProduct);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    form.reset();
    addProduct({
      addon: [],
      id: generateId(),
      name: values.name,
      price: +values.price / +values.qty,
      productId: "",
      qty: +values.qty,
      variantId: "",
      isCustom: true,
      discount: {
        isDiscounted: false,
        name: "",
        type: "percent",
        value: 0,
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Nama</Label>
              <FormControl>
                <Input {...field} placeholder="Nama Produk" />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="qty"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Qty</Label>
              <FormControl>
                <Input {...field} placeholder="0" />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Harga</Label>
              <FormControl>
                <Input {...field} placeholder="0" />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
        <Button>Submit</Button>
      </form>
    </Form>
  );
};
