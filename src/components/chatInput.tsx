'use client';

import { Button, Textarea } from '@/components';
import { messageInputOptions } from '@/constants';
import { Send } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useMessageStore } from '@/store/messageStore';
import { useEffect, useRef } from 'react';

const formSchema = z.object({
  message: z.string().min(1),
});
export const ChatInput = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const { sendMessage, selectedChatUser } = useMessageStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when a chat is opened (desktop only - don't trigger keyboard on mobile)
  useEffect(() => {
    if (selectedChatUser && textareaRef.current) {
      // Only auto-focus on desktop devices (not mobile)
      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.innerWidth < 768;

      if (!isMobile) {
        // Small delay to ensure the component is fully rendered
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    }
  }, [selectedChatUser]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 40; // Minimum height when empty
      const maxHeight = 120; // Max height in pixels (about 5-6 lines)
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      );
      textarea.style.height = `${newHeight}px`;
    }
  };

  const messageValue = form.watch('message');

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    form.reset();
    // Reset textarea height after sending to minimum height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    await sendMessage(values.message);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          {' '}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Type your message"
                    className="text-primary relative px-2 py-2 border-none focus:border-none focus:outline-none bg-gray200 w-full min-h-[40px] max-h-[120px] overflow-y-auto"
                    rows={1}
                    {...field}
                    ref={e => {
                      textareaRef.current = e;
                      if (field.ref) {
                        field.ref(e);
                      }
                    }}
                    onInput={adjustTextareaHeight}
                    onKeyDown={e => {
                      // Submit on Enter, but allow Shift+Enter for new line
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
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

          <Button
            type="submit"
            className="center cursor-pointer border-primary"
            variant={'outline'}
            disabled={!form.watch('message')?.trim()}
          >
            {' '}
            <Send className="text-primary" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
