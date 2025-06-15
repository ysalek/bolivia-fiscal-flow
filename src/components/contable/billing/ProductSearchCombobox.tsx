
import { useState } from "react";
import { Producto } from "../products/ProductsData";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProductSearchComboboxProps {
  productos: Producto[];
  value: string;
  onChange: (productId: string) => void;
  error?: string;
}

const ProductSearchCombobox = ({ productos, value, onChange, error }: ProductSearchComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selected = productos.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            error ? "border-red-500" : ""
          )}
        >
          {selected
            ? (
              <span>
                {selected.nombre}
                <span className="ml-2 text-xs text-gray-400">({selected.codigo})</span>
              </span>
            )
            : "Seleccionar producto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50">
        <Command>
          <CommandInput placeholder="Buscar producto por nombre o código..." autoFocus />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {productos.map((producto) => (
                <CommandItem
                  key={producto.id}
                  value={`${producto.nombre} ${producto.codigo}`}
                  onSelect={() => {
                    onChange(producto.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === producto.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <span className="font-medium">{producto.nombre}</span>
                    <span className="ml-2 text-xs text-gray-400">{producto.codigo}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSearchCombobox;
