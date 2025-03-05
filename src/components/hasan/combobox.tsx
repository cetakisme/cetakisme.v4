import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { DialogProps } from "@radix-ui/react-dialog";
import { ChevronsUpDown } from "lucide-react";
import React from "react";

export function Combobox<TData>({
  open,
  renderSelected,
  title,
  data,
  onSelected,
  renderAddButton,
  renderItem,
  ...props
}: DialogProps & {
  title: string;
  data: TData[];
  onSelected: (data: TData) => void;
  renderAddButton?: () => React.ReactNode;
  renderSelected: (data: TData) => React.ReactNode;
  renderItem: (data: TData) => React.ReactNode;
}) {
  const [selectedData, setSelectedData] = React.useState<TData | null>(null);
  return (
    <Popover open={open} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedData ? renderSelected(selectedData) : `Pilih ${title}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={`Cari ${title}...`} />
          <CommandList>
            <CommandEmpty>${title} Tidak Ditemukan</CommandEmpty>
            <CommandGroup>
              {data?.map((framework, i) => (
                <CommandItem
                  key={i}
                  value={i.toString()}
                  onSelect={(currentValue) => {
                    setSelectedData(framework);
                    onSelected(framework);
                  }}
                >
                  {renderItem(framework)}
                </CommandItem>
              ))}
            </CommandGroup>
            {renderAddButton && renderAddButton()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
