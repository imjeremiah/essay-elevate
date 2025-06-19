/**
 * @file This file contains a client component for handling actions
 * related to a single document, such as renaming or deleting it.
 */
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteDocument, renameDocument } from './actions';

interface DocumentActionsProps {
  documentId: string;
}

function RenameDocumentDialog({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = async () => {
    const { error } = await renameDocument(documentId, newTitle);
    if (!error) {
      setOpen(false);
    } else {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogDescription>
            Enter a new title for your document.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="col-span-3"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleRename}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDocumentDialog({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            document and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={() => deleteDocument(documentId)}>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Renders a dropdown menu with actions for a document, including deleting and renaming it.
 *
 * @param {DocumentActionsProps} props - The component props.
 * @returns The rendered document actions component.
 */
export function DocumentActions({ documentId }: DocumentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={`/editor/${documentId}`}
            className="w-full cursor-pointer"
          >
            Open
          </Link>
        </DropdownMenuItem>
        <RenameDocumentDialog documentId={documentId}>
          <DropdownMenuItem onSelect={e => e.preventDefault()}>
            Rename
          </DropdownMenuItem>
        </RenameDocumentDialog>
        <DropdownMenuSeparator />
        <DeleteDocumentDialog documentId={documentId}>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={e => e.preventDefault()}
          >
            Delete
          </DropdownMenuItem>
        </DeleteDocumentDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 