import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export const getDialogComponents = (isMobile: boolean) => {
  if (isMobile) {
    return {
      Dialog: Drawer,
      DialogContent: DrawerContent,
      DialogDescription: DrawerDescription,
      DialogFooter: DrawerFooter,
      DialogHeader: DrawerHeader,
      DialogTitle: DrawerTitle,
      DialogTrigger: DrawerTrigger,
    };
  }

  return {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  };
};
