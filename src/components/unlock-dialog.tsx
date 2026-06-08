import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnlockDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-accent-foreground" />
          </div>
          <DialogTitle className="text-center">Contact details are locked</DialogTitle>
          <DialogDescription className="text-center">
            Enter your Access Code or upgrade your plan to view customer phone numbers and chat directly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          <Link to="/access-code" onClick={() => onOpenChange(false)}>
            <Button className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" /> Enter Access Code
            </Button>
          </Link>
          <Link to="/plans" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full" size="lg">Upgrade Now</Button>
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
