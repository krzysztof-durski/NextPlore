import User from './user.js';
import Tag from './tag.js';
import Location from './location.js';
import UserTag from './user_tag.js';
import PlaceTag from './place_tag.js';

// User and UserTag (Many-to-Many through UserTag)
User.hasMany(UserTag, { foreignKey: 'userId' });
UserTag.belongsTo(User, { foreignKey: 'userId' });

Tag.hasMany(UserTag, { foreignKey: 'tagId' });
UserTag.belongsTo(Tag, { foreignKey: 'tagId' });

// Location and PlaceTag (Many-to-Many through PlaceTag)
Location.hasMany(PlaceTag, { foreignKey: 'locationId' });
PlaceTag.belongsTo(Location, { foreignKey: 'locationId' });

Tag.hasMany(PlaceTag, { foreignKey: 'tagId' });
PlaceTag.belongsTo(Tag, { foreignKey: 'tagId' });