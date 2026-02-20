'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import { Icon } from '@iconify/react';
import type { CartItem } from '@/types';

interface DatasetCartModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function DatasetCartModal({ open, onClose, items, onRemoveItem, onClearCart }: DatasetCartModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>ชุดข้อมูลที่เลือก ({items.length})</span>
          {items.length > 0 && (
            <Button
              size="small"
              color="error"
              onClick={onClearCart}
              startIcon={<Icon icon="mdi:delete" />}
            >
              ล้างทั้งหมด
            </Button>
          )}
        </div>
      </DialogTitle>
      <DialogContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon icon="mdi:cart-off" className="w-16 h-16 mx-auto mb-2 text-gray-400" />
            <p>ยังไม่มีชุดข้อมูลในรายการ</p>
          </div>
        ) : (
          <List>
            {items.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" onClick={() => onRemoveItem(item.id)}>
                      <Icon icon="mdi:delete" className="w-5 h-5 text-red-600" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary="Dataset"
                  />
                </ListItem>
              </div>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
