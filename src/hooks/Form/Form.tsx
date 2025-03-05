import {
  Form as F,
  FormControl,
  FormField as FF,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type PropsWithChildren } from "react";
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
  type UseFormStateReturn,
  useForm as _useForm,
} from "react-hook-form";
import { type z } from "zod";

export function useForm<T extends z.ZodTypeAny>(opts: {
  schema: T;
  defaultValues?: DefaultValues<z.TypeOf<T>>;
}) {
  const form = _useForm<z.infer<T>>({
    resolver: zodResolver(opts.schema),
    defaultValues: opts.defaultValues,
  });

  return form;
}

interface CreateFormProps<TSchema extends FieldValues> {
  className?: string;
  handleSubmit: (values: TSchema) => void;
  form: UseFormReturn<TSchema>;
}

function Form<TSchema extends FieldValues>({
  children,
  form,
  handleSubmit,
  ...props
}: PropsWithChildren &
  React.ComponentProps<"form"> &
  CreateFormProps<TSchema>) {
  return (
    <F {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} {...props}>
        {children}
      </form>
    </F>
  );
}

interface FormFieldProps<TSchema extends FieldValues> {
  formControl: UseFormReturn<TSchema>;
  name: Path<TSchema>;
  label?: string;
  rootClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

function InputField<TSchema extends FieldValues>({
  formControl,
  name,
  label,
  inputClassName,
  labelClassName,
  rootClassName,
  ...props
}: FormFieldProps<TSchema> & React.ComponentProps<"input">) {
  return (
    <FF
      control={formControl.control}
      name={name}
      render={(data) => (
        <FormItem className={rootClassName}>
          {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
          <FormControl>
            <Input {...data.field} {...props} className={inputClassName} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormField<TSchema extends FieldValues>({
  formControl,
  name,
  label,
  labelClassName,
  rootClassName,
  render,
}: {
  formControl: UseFormReturn<TSchema>;
  name: Path<TSchema>;
  label?: string;
  rootClassName?: string;
  labelClassName?: string;
  render: ({
    field,
    fieldState,
    formState,
  }: {
    field: ControllerRenderProps<TSchema, Path<TSchema>>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TSchema>;
  }) => React.ReactElement;
}) {
  return (
    <FF
      control={formControl.control}
      name={name}
      render={(data) => (
        <FormItem className={rootClassName}>
          {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
          <FormControl>{render(data)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { Form, FormField, InputField };
