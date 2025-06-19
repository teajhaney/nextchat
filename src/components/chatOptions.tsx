import { chatOptions } from '@/constants';
import React from 'react';

export const ChatOptions = () => {
  return (
    <div className="flex justify-between gap-5">
      {chatOptions.map(({ icon: Icon, title }) => (
        <Icon
          key={title}
          className="text-gray size-5 cursor-pointer"
          onClick={() => {
            switch (title) {
              case 'Search':
                console.log('Search clicked');
                break;
              case 'Video call':
                console.log('Video call clicked');
                break;
              case 'Phone call':
                console.log('Phone call clicked');
                break;
              case 'Contact info':
                console.log('Contact info clicked');
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
    </div>
  );
};
