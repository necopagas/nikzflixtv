import React from 'react';
import Poster from './Poster';

export default {
  title: 'Components/Poster',
  component: Poster,
};

const Template = (args) => <Poster {...args} />;

export const Default = Template.bind({});
Default.args = {
  item: {
    id: 9999,
    title: 'Poster Story — Test Movie',
    poster_path: null,
    genre_ids: [18, 35],
  },
  onOpenModal: () => alert('Open modal (story)'),
};
