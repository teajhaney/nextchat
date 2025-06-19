"use client"
import { messageInputOptions } from '@/constants';
import { Button } from '@/components';
import { Send } from 'lucide-react';

export const MessageInputOptions = () => {
  return (
    <div className="flex justify-between  items-center gap-5 ">
      {messageInputOptions.map(({ icon: Icon, title }) => (
        <Icon
          key={title}
          className="text-primary size-5 cursor-pointer"
          onClick={() => {
            switch (title) {
              case 'Emoji':
                console.log('Search clicked');
                break;
              case 'File':
                console.log('Video call clicked');
                break;
              case 'Menu':
                console.log('Menu clicked');
                break;
              default:
                console.log('Unknown action');
            }
          }}
        />
      ))}

      <Button className="center cursor-pointer border-primary" variant={'outline'}>
        {' '}
        <Send className="text-primary" />
      </Button>
    </div>
  );
};
