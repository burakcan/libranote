import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
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
    };
  }

  return {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  };
};
