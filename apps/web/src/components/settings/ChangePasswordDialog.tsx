import { Key } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBreakpointSM } from "@/hooks/useBreakpointSM";
import { getDialogComponents } from "../ui/getDialogComponents";
import { ScrollArea } from "../ui/scroll-area";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpointSM();
  const {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } = getDialogComponents(isMobile);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md ">
        <ScrollArea className="min-h-0 h-[90vh] sm:h-auto">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure. Make sure to use
              a strong password.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 px-4 sm:px-0 pb-8 sm:pb-0">
            <ChangePasswordForm
              onSuccess={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
