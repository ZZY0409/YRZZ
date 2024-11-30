import { useState, useEffect } from 'react';
import { db, COLLECTIONS, USER_FIELDS } from '../../firebase/config.js';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserAvatar({ size = 40, showPreview = false, userId }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);

  // 如果传入了 userId，获取该用户的信息
  useEffect(() => {
    if (!userId || userId === currentUser?.uid) return;

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // 使用当前用户或指定用户的头像
  const photoURL = userId ? userData?.[USER_FIELDS.PHOTO_URL] : currentUser?.photoURL;
  const displayName = userId ? userData?.[USER_FIELDS.DISPLAY_NAME] : currentUser?.displayName;

  // 图片压缩函数
  const compressImage = async (file, options = {}) => {
    const {
      maxSize = 50 * 1024,      // 减小到 50KB
      maxWidth = 200,           // 减小到 200px
      maxHeight = 200,          // 减小到 200px
      initQuality = 0.6,        // 降低初始质量到 0.6
      minQuality = 0.3,         // 降低最低质量到 0.3
      qualityStep = 0.1         // 保持步长 0.1
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // 强制缩放到目标尺寸
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality) => {
            const base64 = canvas.toDataURL('image/jpeg', quality);
            const binary = atob(base64.split(',')[1]);
            const size = binary.length;

            console.log(`压缩质量: ${quality.toFixed(2)}, 大小: ${(size/1024).toFixed(2)}KB`);

            if (size > maxSize && quality > minQuality) {
              tryCompress(quality - qualityStep);
            } else if (size > maxSize) {
              reject(new Error('无法将图片压缩到合适大小，请选择更小的图片'));
            } else {
              // 检查最终的 base64 字符串长度
              if (base64.length > 100 * 1024) { // 100KB
                reject(new Error('图片数据太大，请选择更小的图片'));
              } else {
                resolve(base64);
              }
            }
          };

          tryCompress(initQuality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    try {
      setUploading(true);
      const compressedImage = await compressImage(file, {
        maxSize: 50 * 1024,     // 50KB
        maxWidth: 200,          // 200px
        maxHeight: 200,         // 200px
        initQuality: 0.6,       // 0.6
        minQuality: 0.3,        // 0.3
        qualityStep: 0.1
      });

      // 检查最终大小
      if (compressedImage.length > 100 * 1024) {
        throw new Error('图片数据太大，请选择更小的图片');
      }

      setPreviewUrl(compressedImage);

      if (!showPreview) {
        await uploadAvatar(compressedImage);
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      alert(error.message || '处理图片失败');
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (base64Image) => {
    try {
      // 更新用户文档
      await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        [USER_FIELDS.PHOTO_URL]: base64Image
      });

      // 更新 Auth 用户资料 - 直接使用 updateProfile
      const auth = getAuth();
      await updateProfile(auth.currentUser, {
        photoURL: base64Image
      });

      return base64Image;
    } catch (error) {
      console.error('更新头像失败:', error);
      throw error;
    }
  };

  return (
    <div className="user-avatar-container">
      <div className="user-avatar" style={{ width: size, height: size }}>
        {previewUrl ? (
          <img src={previewUrl} alt="预览" className="avatar-image" />
        ) : photoURL ? (
          <img src={photoURL} alt="用户头像" className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            {displayName?.[0] || '?'}
          </div>
        )}
        <label className="avatar-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading ? '处理中...' : '更换头像'}
        </label>
      </div>
      {showPreview && previewUrl && (
        <div className="avatar-preview-modal">
          <div className="preview-content">
            <img src={previewUrl} alt="预览" />
            <div className="preview-actions">
              <button onClick={() => setPreviewUrl(null)}>取消</button>
              <button onClick={() => uploadAvatar(previewUrl)} disabled={uploading}>
                {uploading ? '更新中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 