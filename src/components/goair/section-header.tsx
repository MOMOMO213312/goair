import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  align?: "start" | "center";
};

export function SectionHeader({
  title,
  description,
  className,
  align = "start",
}: SectionHeaderProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
