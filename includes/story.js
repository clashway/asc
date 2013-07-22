var Story = function story(title, user_story, tshirt, vote, chosen) {
    this.title = title || '';
    this.user_story = user_story || '';
    this.tshirt = tshirt || '';
    this.vote = vote || 0;
    this.chosen = chosen || {selected: 0, timestamp: 0};
};
module.exports = Story;