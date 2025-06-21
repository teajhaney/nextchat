'use client';

import React from 'react';
import { Button, Input } from '@/components';
import { messageInputOptions } from '@/constants';
import { Send } from 'lucide-react';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

const formSchema = z.object({
  message: z.string().min(1),
});
export const ChatInput = () => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

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
                  <Input
                    type="text"
                    placeholder="Type your message"
                    className=" relative px-2 py-5 border-none focus:border-none focus:outline-none bg-gray200 w-full"
                    {...field}
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
          >
            {' '}
            <Send className="text-primary" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
