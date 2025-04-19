import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type DialogProps } from "@radix-ui/react-dialog";
import React from "react";

export function PopoverButton<TData extends { name: string }>({
  renderTrigger,
  title,
  data,
  onSelected,
  renderAddButton,
  renderItem,
  onInputChange,
  controlled = false,
}: DialogProps & {
  title: string;
  data: TData[];
  controlled?: boolean;
  onInputChange?: (s: string) => void;
  onSelected: (data: TData) => void;
  renderAddButton?: () => React.ReactNode;
  renderTrigger?: () => React.ReactNode;
  renderItem: (data: TData) => React.ReactNode;
}) {
  return (
    <Popover>
      {renderTrigger && (
        <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      )}
      <PopoverContent className="w-[200px] p-0">
        <Command>
          {controlled ? (
            <CommandInput
              placeholder={`Cari ${title}...`}
              onValueChange={onInputChange}
            />
          ) : (
            <CommandInput placeholder={`Cari ${title}...`} />
          )}

          <CommandList>
            <CommandEmpty>{title} Tidak Ditemukan</CommandEmpty>
            <CommandGroup>
              {data?.map((framework, i) => (
                <CommandItem
                  key={i}
                  value={framework.name}
                  onSelect={() => {
                    onSelected(framework);
                  }}
                >
                  {renderItem(framework)}
                </CommandItem>
              ))}
            </CommandGroup>
            {renderAddButton?.()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
