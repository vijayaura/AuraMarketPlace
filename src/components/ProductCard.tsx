import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface ProductCardProps {
  code: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}

export const ProductCard = ({ code, name, description, icon, onClick }: ProductCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 border border-border hover:border-primary hover:shadow-lg group h-full"
      onClick={onClick}
    >
      <CardHeader className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <div className="text-primary">
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold line-clamp-1">{name}</CardTitle>
            <span className="text-xs font-mono text-muted-foreground">
              {code}
            </span>
          </div>
        </div>
        <CardDescription className="text-xs leading-relaxed line-clamp-4">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

