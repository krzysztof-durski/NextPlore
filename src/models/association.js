import User from './user.js';
import Tag from './tag.js';
import Location from './location.js';

// User and Tag (Many-to-Many)
User.belongsToMany(Tag, { through: 'user_tag', foreignKey: 'userId' });
Tag.belongsToMany(User, { through: 'user_tag', foreignKey: 'tagId' });

// Location and Tag (Many-to-Many)
Location.belongsToMany(Tag, { through: 'place_tag', foreignKey: 'locationId' });
Tag.belongsToMany(Location, { through: 'place_tag', foreignKey: 'tagId' });