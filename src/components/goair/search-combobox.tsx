import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchComboboxProps = {
  id?: string;
  label: string;
  placeholder: string;
  emptyText?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SearchCombobox({
  id,
  label,
  placeholder,
  emptyText = "لا توجد نتائج.",
  options,
  value,
  onChange,
  disabled,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            className={cn(
              "h-11 w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
              !value && "text-muted-foreground",
            )}
          >
            <span className="truncate text-start">
              {selected ? (
                <>
                  <span className="font-medium text-foreground">{selected.label}</span>
                  {selected.hint ? (
                    <span className="mr-1 text-xs text-muted-foreground">({selected.hint})</span>
                  ) : null}
                </>
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`ابحث…`} className="h-10" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.hint ?? ""} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="cursor-pointer py-2.5"
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{option.label}</span>
                      {option.hint ? (
                        <span className="text-xs text-muted-foreground">{option.hint}</span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
